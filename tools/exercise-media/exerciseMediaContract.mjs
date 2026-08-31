/**
 * The parts of docs/EXERCISE_MEDIA_SPEC.md that both tools need to agree on.
 *
 * The specification is the document; this file is the machine-readable half of
 * it. If you change one, change the other — the validator's failure messages
 * quote the section numbers so a broken file leads someone back to the prose.
 */

import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const thisDirectory = dirname(fileURLToPath(import.meta.url));

/** The repository root, derived from this file rather than the shell's cwd. */
export const REPOSITORY_ROOT_DIRECTORY = resolve(thisDirectory, '..', '..');

/** Where generated animations live. Spec section 6. */
export const EXERCISE_MEDIA_DIRECTORY = join(REPOSITORY_ROOT_DIRECTORY, 'public', 'exercise-media');

/**
 * The hand-checked reference file. It is passed into every generation call as
 * the style to match, and it is validated like everything else — an exemplar
 * that broke the contract would teach every future file to break it too.
 */
export const EXEMPLAR_FILE_NAME = '_exemplar-seated-cable-row.svg';

/** Spec section 3, requirement 2. */
export const REQUIRED_VIEW_BOX = '0 0 400 400';

/** Spec section 3, requirement 13. */
export const MAXIMUM_FILE_SIZE_BYTES = 12 * 1024;

/** Spec section 3, requirement 6. */
export const REQUIRED_ANIMATION_DURATION = '3s';

/**
 * Spec section 4. This list is exhaustive: an SVG referencing any other custom
 * property fails validation, because a property no palette defines would fall
 * back to its literal and stop following the palette switcher.
 *
 * The fallbacks are the purple-blue palette's values, which is the palette the
 * app was designed against. They only ever show up outside the app — in a file
 * preview, or in a pull request diff viewer.
 */
export const APPROVED_CUSTOM_PROPERTIES = Object.freeze({
  '--muscle-body-fill': '#1C1934',
  '--muscle-body-stroke': '#4A4470',
  '--muscle-highlight-primary': '#A855F7',
  '--muscle-highlight-secondary': '#3D8BFF',
  '--muscle-equipment-fill': '#241F42',
  '--muscle-equipment-stroke': '#5A5385',
  '--muscle-motion-trail': '#7C5CFF',
});

/** Spec section 3, requirement 8. Body outlines are 3, equipment is 2. */
export const APPROVED_STROKE_WIDTHS = Object.freeze(['2', '3']);

// -----------------------------------------------------------------------------
// Reading the training content
//
// These tools import the content's TypeScript directly. Node strips the types,
// and the grouped content files import nothing but types, so no build step is
// needed to read them.
//
// The aggregating modules (`allExercises.ts`, `twelveWeekFoundationProgram.ts`)
// are deliberately NOT used: their relative imports have no file extension,
// which Vite resolves and Node's ESM loader does not. Reading the grouped files
// directly sidesteps that, and picking them up by directory listing means a new
// group file is included without anyone remembering to add it here.
// -----------------------------------------------------------------------------

const EXERCISE_CONTENT_DIRECTORY = join(REPOSITORY_ROOT_DIRECTORY, 'src', 'content', 'exercises');

const AGGREGATING_MODULES_TO_SKIP = ['allExercises.ts'];

async function importEveryArrayExportedFrom(directory, fileNamesToSkip) {
  const fileNames = (await readdir(directory))
    .filter((fileName) => fileName.endsWith('.ts'))
    .filter((fileName) => !fileName.endsWith('.test.ts'))
    .filter((fileName) => !fileNamesToSkip.includes(fileName))
    .sort();

  const collected = [];

  for (const fileName of fileNames) {
    const module = await import(pathToFileURL(join(directory, fileName)).href);

    for (const exportedValue of Object.values(module)) {
      if (Array.isArray(exportedValue)) {
        collected.push(...exportedValue);
      }
    }
  }

  return collected;
}

let cachedExercises = null;

/** Every exercise the content defines, in content order. */
export async function loadAllExercises() {
  cachedExercises ??= await importEveryArrayExportedFrom(
    EXERCISE_CONTENT_DIRECTORY,
    AGGREGATING_MODULES_TO_SKIP,
  );

  return cachedExercises;
}

/** One exercise by id, or null when the content does not define it. */
export async function findExerciseById(exerciseId) {
  const exercises = await loadAllExercises();

  return exercises.find((exercise) => exercise.exerciseId === exerciseId) ?? null;
}

const PROGRAM_CONTENT_DIRECTORY = join(
  REPOSITORY_ROOT_DIRECTORY,
  'src',
  'content',
  'programs',
  'twelveWeekFoundation',
);

const MOBILITY_CONTENT_DIRECTORY = join(REPOSITORY_ROOT_DIRECTORY, 'src', 'content', 'mobility');

async function importDefaultExportsFrom(directory, fileNames) {
  const modules = [];

  for (const fileName of fileNames) {
    modules.push(await import(pathToFileURL(join(directory, fileName)).href));
  }

  return modules;
}

/**
 * Every exercise that needs an animation, most urgent first.
 *
 * The order is the one docs/PROGRESS.md asks for, and it is computed from the
 * programme rather than written down: the movements Omar will meet in week 1
 * come first, then the ones the later phases add, then the mobility-only drills,
 * and last the movements that are defined as substitutes but never prescribed.
 */
export async function loadExercisesInGenerationPriorityOrder() {
  const exercises = await loadAllExercises();

  const [phaseOne, phaseTwo, phaseThree, warmup] = await importDefaultExportsFrom(
    PROGRAM_CONTENT_DIRECTORY,
    [
      'phaseOneSessionTemplates.ts',
      'phaseTwoSessionTemplates.ts',
      'phaseThreeSessionTemplates.ts',
      'warmupRoutine.ts',
    ],
  );
  const [mobility] = await importDefaultExportsFrom(MOBILITY_CONTENT_DIRECTORY, [
    'deskUndoRoutine.ts',
  ]);

  const idsInSessionTemplates = (module) =>
    Object.values(module)
      .flat()
      .flatMap((sessionTemplate) => sessionTemplate.exerciseSlots ?? [])
      .map((slot) => slot.exerciseId);

  const idsInSteps = (module) =>
    Object.values(module)
      .flatMap((routine) => routine.steps ?? [])
      .map((step) => step.exerciseId);

  const priorityTiers = [
    [...idsInSessionTemplates(phaseOne), ...idsInSteps(warmup)],
    [...idsInSessionTemplates(phaseTwo), ...idsInSessionTemplates(phaseThree)],
    idsInSteps(mobility),
  ];

  const rankByExerciseId = new Map();

  priorityTiers.forEach((exerciseIds, tierIndex) => {
    for (const exerciseId of exerciseIds) {
      if (!rankByExerciseId.has(exerciseId)) {
        rankByExerciseId.set(exerciseId, tierIndex);
      }
    }
  });

  const rankOfUnprescribedExercise = priorityTiers.length;

  return [...exercises].sort((left, right) => {
    const leftRank = rankByExerciseId.get(left.exerciseId) ?? rankOfUnprescribedExercise;
    const rightRank = rankByExerciseId.get(right.exerciseId) ?? rankOfUnprescribedExercise;

    return leftRank - rightRank;
  });
}

/** `public/exercise-media/{exerciseId}.svg`. Spec section 6. */
export function buildMediaFilePathForExercise(exerciseId) {
  return join(EXERCISE_MEDIA_DIRECTORY, `${exerciseId}.svg`);
}
