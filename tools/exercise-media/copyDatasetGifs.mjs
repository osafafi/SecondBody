#!/usr/bin/env node
/**
 * Copies the matched animations out of the cloned dataset and into
 * `public/exercise-media/`, named by exercise id.
 *
 * ```bash
 * npm run media:copy               # copy everything the match table names
 * npm run media:copy legExtension  # copy one
 * ```
 *
 * This is the only thing that touches `vendor/`. Once it has run, the copied
 * files are committed and neither the app nor `npm run verify` needs the clone
 * again — which is what makes a 296 MB dependency a one-off rather than
 * something every future session has to have on disk.
 *
 * **It refuses to copy a file whose record no longer says what the match table
 * says it said.** The table records the dataset's own name for each chosen
 * record; if the dataset is re-cloned and the ids have moved, the name check
 * fails and nothing is written. Silently copying a squat over a deadlift
 * because a row number shifted is exactly the failure this is here to prevent.
 */

import { copyFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

import {
  buildMediaFileNameForExercise,
  buildMediaFilePathForExercise,
  DATASET_DIRECTORY,
  EXERCISE_MEDIA_DIRECTORY,
  loadDatasetRecordsById,
  loadExerciseMediaMatches,
} from './exerciseMediaDataset.mjs';

/**
 * The resolution the media licence allows, and what the dataset ships.
 *
 * Nothing here resizes anything — the check exists so that a dataset that
 * started shipping larger files would stop this tool rather than quietly put
 * the project outside the terms the files are used under. See
 * `public/exercise-media/ATTRIBUTION.md`.
 */
const LARGEST_ALLOWED_FILE_SIZE_BYTES = 4 * 1024 * 1024;

async function copyOneMatch(match, datasetRecordsById) {
  const record = datasetRecordsById.get(match.datasetExerciseId);

  if (!record) {
    return {
      exerciseId: match.exerciseId,
      wasCopied: false,
      problem: `The dataset has no record ${match.datasetExerciseId}.`,
    };
  }

  if (record.name !== match.datasetExerciseName) {
    return {
      exerciseId: match.exerciseId,
      wasCopied: false,
      problem:
        `Record ${match.datasetExerciseId} is now "${record.name}", but the match table ` +
        `was written against "${match.datasetExerciseName}". Look at the drawing again ` +
        `before trusting this match.`,
    };
  }

  const sourceFilePath = join(DATASET_DIRECTORY, record.gif_url);

  let sourceFileStats;

  try {
    sourceFileStats = await stat(sourceFilePath);
  } catch {
    return {
      exerciseId: match.exerciseId,
      wasCopied: false,
      problem: `${record.gif_url} is missing from the clone.`,
    };
  }

  if (sourceFileStats.size > LARGEST_ALLOWED_FILE_SIZE_BYTES) {
    return {
      exerciseId: match.exerciseId,
      wasCopied: false,
      problem:
        `${record.gif_url} is ${Math.round(sourceFileStats.size / 1024)} KB, which is far ` +
        `larger than the 180×180 animations this pipeline expects. Check what the dataset ` +
        `is shipping before copying it in.`,
    };
  }

  await copyFile(sourceFilePath, buildMediaFilePathForExercise(match.exerciseId));

  return {
    exerciseId: match.exerciseId,
    wasCopied: true,
    sizeInBytes: sourceFileStats.size,
    datasetExerciseId: match.datasetExerciseId,
    datasetExerciseName: match.datasetExerciseName,
  };
}

async function main() {
  const requestedExerciseIds = process.argv
    .slice(2)
    .filter((argument) => !argument.startsWith('-'));

  const { matches, misses } = await loadExerciseMediaMatches();
  const datasetRecordsById = await loadDatasetRecordsById();

  const matchesToCopy =
    requestedExerciseIds.length === 0
      ? matches
      : matches.filter((match) => requestedExerciseIds.includes(match.exerciseId));

  if (matchesToCopy.length === 0) {
    const namesOfRequested = requestedExerciseIds.join(', ');
    const isDeliberatelyUnmatched = misses.some((miss) =>
      requestedExerciseIds.includes(miss.exerciseId),
    );

    console.error(
      isDeliberatelyUnmatched
        ? `${namesOfRequested} is in exercisesWithoutMediaMatch — it draws the "No preview yet" fallback on purpose.`
        : `Nothing in the match table matches: ${namesOfRequested}`,
    );

    process.exitCode = 1;

    return;
  }

  await mkdir(EXERCISE_MEDIA_DIRECTORY, { recursive: true });

  const results = [];

  for (const match of matchesToCopy) {
    results.push(await copyOneMatch(match, datasetRecordsById));
  }

  const copied = results.filter((result) => result.wasCopied);
  const failed = results.filter((result) => !result.wasCopied);

  for (const result of copied) {
    console.log(
      `  ${buildMediaFileNameForExercise(result.exerciseId).padEnd(34)} ` +
        `${String(Math.round(result.sizeInBytes / 1024)).padStart(4)} KB   ` +
        `${result.datasetExerciseId} ${result.datasetExerciseName}`,
    );
  }

  for (const result of failed) {
    console.error(`  FAILED ${result.exerciseId}: ${result.problem}`);
  }

  const totalSizeInKilobytes = Math.round(
    copied.reduce((total, result) => total + result.sizeInBytes, 0) / 1024,
  );

  console.log(`\n${copied.length} copied, ${totalSizeInKilobytes} KB total.`);

  if (requestedExerciseIds.length === 0) {
    console.log(`${misses.length} exercises have no match and draw the fallback.`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

await main();
