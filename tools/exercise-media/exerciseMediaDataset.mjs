/**
 * Reading the two halves of the media pipeline: the cloned dataset, and the
 * committed table that says which of its 1324 animations belong to which of
 * this app's exercises.
 *
 * Both `copyDatasetGifs.mjs` and `verifyExerciseMedia.mjs` need these, and they
 * must agree about them, so they are here rather than in either one.
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const thisDirectory = dirname(fileURLToPath(import.meta.url));

/** The repository root, derived from this file rather than the shell's cwd. */
export const REPOSITORY_ROOT_DIRECTORY = resolve(thisDirectory, '..', '..');

/** Where the copied animations live, and what the app serves. */
export const EXERCISE_MEDIA_DIRECTORY = join(REPOSITORY_ROOT_DIRECTORY, 'public', 'exercise-media');

/**
 * The clone of `hasaneyldrm/exercises-dataset`.
 *
 * `vendor/` is gitignored: 296 MB of other people's media does not belong in
 * this repository's history, and only the 27 files actually used are copied out
 * of it. Anyone can recreate it with the command in `README.md`.
 */
export const DATASET_DIRECTORY = join(REPOSITORY_ROOT_DIRECTORY, 'vendor', 'exercises-dataset');

/** The extension the animations are copied in as. The dataset ships GIFs. */
export const MEDIA_FILE_EXTENSION = '.gif';

/**
 * How the app names an animation: by the exercise's own id, so nothing needs a
 * lookup at render time beyond the match table itself.
 */
export function buildMediaFileNameForExercise(exerciseId) {
  return `${exerciseId}${MEDIA_FILE_EXTENSION}`;
}

export function buildMediaFilePathForExercise(exerciseId) {
  return join(EXERCISE_MEDIA_DIRECTORY, buildMediaFileNameForExercise(exerciseId));
}

// -----------------------------------------------------------------------------
// Reading the committed content
//
// These tools import the content's TypeScript directly. Node strips the types,
// and the content files they reach for import nothing but types, so there is no
// build step and no second copy of the exercise list to fall out of date.
//
// The aggregating modules (`allExercises.ts`, `allExerciseMedia.ts`) are
// deliberately NOT used: their relative imports have no file extension, which
// Vite resolves and Node's ESM loader does not.
// -----------------------------------------------------------------------------

async function importModule(...pathSegments) {
  const filePath = join(REPOSITORY_ROOT_DIRECTORY, ...pathSegments);

  return import(pathToFileURL(filePath).href);
}

/**
 * Every exercise the app knows about.
 *
 * The grouped content files are picked up by listing the directory, so a new
 * group file is included without anyone remembering to come back here.
 */
export async function loadAllExercises() {
  const directory = join(REPOSITORY_ROOT_DIRECTORY, 'src', 'content', 'exercises');

  const fileNames = (await readdir(directory))
    .filter((fileName) => fileName.endsWith('.ts'))
    .filter((fileName) => !fileName.endsWith('.test.ts'))
    .filter((fileName) => fileName !== 'allExercises.ts')
    .sort();

  const exercises = [];

  for (const fileName of fileNames) {
    const module = await importModule('src', 'content', 'exercises', fileName);

    for (const exportedValue of Object.values(module)) {
      if (Array.isArray(exportedValue)) {
        exercises.push(...exportedValue);
      }
    }
  }

  return exercises;
}

/** The curated table: which dataset animation was chosen for which exercise. */
export async function loadExerciseMediaMatches() {
  const module = await importModule('src', 'content', 'exerciseMedia', 'exerciseMediaMatches.ts');

  return {
    matches: module.exerciseMediaMatches,
    misses: module.exercisesWithoutMediaMatch,
  };
}

/**
 * The dataset's records, indexed by id.
 *
 * The JSON is 17 MB, which is fine to read once in a build tool and would not
 * be fine anywhere near the app.
 */
export async function loadDatasetRecordsById() {
  const filePath = join(DATASET_DIRECTORY, 'data', 'exercises.json');

  let fileContents;

  try {
    fileContents = await readFile(filePath, 'utf8');
  } catch {
    throw new Error(
      [
        `The dataset is not cloned at ${DATASET_DIRECTORY}.`,
        '',
        'Clone it with:',
        '',
        '  git clone --depth 1 https://github.com/hasaneyldrm/exercises-dataset.git vendor/exercises-dataset',
        '',
        'It is gitignored, so it has to be cloned once per machine. Only the copying',
        'tool needs it — the app and `npm run verify` read the committed files instead.',
      ].join('\n'),
    );
  }

  const records = JSON.parse(fileContents);

  return new Map(records.map((record) => [record.id, record]));
}
