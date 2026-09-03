#!/usr/bin/env node
/**
 * Checks that the committed animations and the committed match table say the
 * same thing.
 *
 * ```bash
 * npm run media:verify
 * ```
 *
 * Unlike `copyDatasetGifs.mjs` this needs no clone of the dataset — it reads
 * only what is in this repository, which is why it can run in CI and in
 * `npm run verify`.
 *
 * The three ways the two halves drift apart, all of which fail here:
 *
 * 1. A row was added to the match table and nobody ran `npm run media:copy`,
 *    so the app asks for a file that does not exist.
 * 2. A file was committed without a row, so it is served by nothing and
 *    reviewed by no one.
 * 3. An exercise is in neither list, so it silently loses its preview when
 *    somebody adds an exercise and forgets the media.
 */

import { readdir, stat } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  buildMediaFileNameForExercise,
  buildMediaFilePathForExercise,
  EXERCISE_MEDIA_DIRECTORY,
  loadAllExercises,
  loadExerciseMediaMatches,
  MEDIA_FILE_EXTENSION,
} from './exerciseMediaDataset.mjs';

/**
 * Files in `public/exercise-media/` that are not an exercise's animation.
 *
 * The attribution notice is required to sit next to the media it covers, so it
 * is a deliberate resident of the directory rather than an orphan.
 */
const FILES_THAT_ARE_NOT_ANIMATIONS = ['ATTRIBUTION.md'];

/**
 * Collects everything wrong with the committed media, rather than stopping at
 * the first problem: someone who has just added four exercises wants all four
 * complaints in one run, not four runs.
 */
export async function findExerciseMediaProblems({
  exercises,
  matches,
  misses,
  committedFileNames,
}) {
  const problems = [];

  const matchedExerciseIds = new Set(matches.map((match) => match.exerciseId));
  const unmatchedExerciseIds = new Set(misses.map((miss) => miss.exerciseId));
  const knownExerciseIds = new Set(exercises.map((exercise) => exercise.exerciseId));

  for (const match of matches) {
    if (!knownExerciseIds.has(match.exerciseId)) {
      problems.push(
        `The match table names "${match.exerciseId}", which is not an exercise. ` +
          `Either the id is a typo or the exercise was removed without its match.`,
      );
    }

    if (unmatchedExerciseIds.has(match.exerciseId)) {
      problems.push(
        `"${match.exerciseId}" is in both exerciseMediaMatches and ` +
          `exercisesWithoutMediaMatch. It cannot be both.`,
      );
    }

    if (match.matchQuality === 'close' && match.differenceFromOurVersion.trim() === '') {
      problems.push(
        `"${match.exerciseId}" is a close match with no note saying what differs. ` +
          `That note is the only thing that makes a close match reviewable.`,
      );
    }

    if (match.mediaSource === 'generatedForThisApp' && !match.whatTheAnimationShows?.trim()) {
      problems.push(
        `"${match.exerciseId}" was generated for this app with no note saying what its ` +
          `frames show. A generated animation has no dataset record to check it against, ` +
          `so that note is the only thing that makes it reviewable.`,
      );
    }

    if (!committedFileNames.has(buildMediaFileNameForExercise(match.exerciseId))) {
      // A dataset row is fixed by re-running the copier; a generated one has no
      // source to copy from, so saying "run media:copy" would send whoever hits
      // this to a tool that will refuse them.
      problems.push(
        match.mediaSource === 'generatedForThisApp'
          ? `"${match.exerciseId}" has a generated animation in the table but ` +
              `${buildMediaFileNameForExercise(match.exerciseId)} is not committed. ` +
              `The file has to be added by hand — nothing can regenerate it.`
          : `"${match.exerciseId}" is matched to ${match.datasetExerciseId} but ` +
              `${buildMediaFileNameForExercise(match.exerciseId)} is not committed. ` +
              `Run: npm run media:copy ${match.exerciseId}`,
      );
    }
  }

  for (const miss of misses) {
    if (!knownExerciseIds.has(miss.exerciseId)) {
      problems.push(
        `exercisesWithoutMediaMatch names "${miss.exerciseId}", which is not an exercise.`,
      );
    }

    if (committedFileNames.has(buildMediaFileNameForExercise(miss.exerciseId))) {
      problems.push(
        `"${miss.exerciseId}" is listed as having no match, but ` +
          `${buildMediaFileNameForExercise(miss.exerciseId)} is committed. ` +
          `Move it into exerciseMediaMatches or delete the file.`,
      );
    }
  }

  for (const exercise of exercises) {
    if (
      !matchedExerciseIds.has(exercise.exerciseId) &&
      !unmatchedExerciseIds.has(exercise.exerciseId)
    ) {
      problems.push(
        `"${exercise.exerciseId}" is in neither list. Every exercise needs either a ` +
          `match or a written reason there is not one, so a missing preview is always ` +
          `a decision somebody made.`,
      );
    }
  }

  for (const fileName of committedFileNames) {
    const exerciseId = fileName.slice(0, -MEDIA_FILE_EXTENSION.length);

    if (!matchedExerciseIds.has(exerciseId)) {
      problems.push(
        `${fileName} is committed but nothing in the match table asks for it. ` +
          `It is served to nobody.`,
      );
    }
  }

  return problems;
}

async function main() {
  const [exercises, { matches, misses }, directoryEntries] = await Promise.all([
    loadAllExercises(),
    loadExerciseMediaMatches(),
    readdir(EXERCISE_MEDIA_DIRECTORY),
  ]);

  const unexpectedFileNames = directoryEntries.filter(
    (fileName) =>
      !fileName.endsWith(MEDIA_FILE_EXTENSION) && !FILES_THAT_ARE_NOT_ANIMATIONS.includes(fileName),
  );

  const committedFileNames = new Set(
    directoryEntries.filter((fileName) => fileName.endsWith(MEDIA_FILE_EXTENSION)),
  );

  const problems = await findExerciseMediaProblems({
    exercises,
    matches,
    misses,
    committedFileNames,
  });

  for (const fileName of unexpectedFileNames) {
    problems.push(
      `${fileName} is in public/exercise-media/ and is not an animation. ` +
        `The app serves this whole directory.`,
    );
  }

  if (problems.length > 0) {
    console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);

    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }

    process.exitCode = 1;

    return;
  }

  const sizesInBytes = await Promise.all(
    matches.map(
      async (match) => (await stat(buildMediaFilePathForExercise(match.exerciseId))).size,
    ),
  );

  const totalSizeInKilobytes = Math.round(
    sizesInBytes.reduce((total, size) => total + size, 0) / 1024,
  );

  const datasetMatches = matches.filter((match) => match.mediaSource !== 'generatedForThisApp');
  const closeMatchCount = datasetMatches.filter((match) => match.matchQuality === 'close').length;

  console.log(
    `${matches.length} animations: ${datasetMatches.length} from the dataset ` +
      `(${closeMatchCount} close, ${datasetMatches.length - closeMatchCount} exact) and ` +
      `${matches.length - datasetMatches.length} generated for this app, ` +
      `${totalSizeInKilobytes} KB. ` +
      `${misses.length} exercise${misses.length === 1 ? '' : 's'} with no animation at all.`,
  );
}

// Only run when invoked directly, because the test imports the checking
// function. `pathToFileURL` rather than a string comparison: on Windows
// `process.argv[1]` is a backslashed path and `import.meta.url` is a file URL,
// and they only agree once one has been converted into the other's shape.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
