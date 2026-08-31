#!/usr/bin/env node

/**
 * Draws an exercise animation by asking the codex CLI for one.
 *
 * The codex CLI on this machine is authenticated through a ChatGPT
 * subscription, which grants code generation and not image generation — so the
 * media is code. See docs/EXERCISE_MEDIA_SPEC.md section 1 for why that turned
 * out to be the better answer anyway.
 *
 * Consistency across three dozen files comes from three things, and this script
 * is where the first two are applied: the written contract and the committed
 * exemplar both go into every prompt, and the validator refuses anything that
 * comes back breaking either. A file is only written once it passes, so a broken
 * animation never reaches the app even for a moment.
 *
 *   node tools/exercise-media/generateExerciseSvg.mjs seatedCableRow
 *   node tools/exercise-media/generateExerciseSvg.mjs --all
 *   node tools/exercise-media/generateExerciseSvg.mjs --all --limit 6 --concurrency 3
 *
 * Flags:
 *   --all           every exercise the programme needs, most urgent first
 *   --limit N       stop after the first N of them
 *   --overwrite     redraw exercises that already have a file
 *   --attempts N    tries per exercise before giving up (default 3)
 *   --concurrency N exercises drawn at once (default 3)
 *   --dry-run       print the prompt for one exercise and generate nothing
 */

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process, { argv } from 'node:process';

import {
  buildMediaFilePathForExercise,
  EXEMPLAR_FILE_NAME,
  EXERCISE_MEDIA_DIRECTORY,
  findExerciseById,
  loadExercisesInGenerationPriorityOrder,
  REPOSITORY_ROOT_DIRECTORY,
} from './exerciseMediaContract.mjs';
import { validateExerciseSvgSource } from './validateExerciseSvg.mjs';

const SPECIFICATION_FILE_PATH = join(REPOSITORY_ROOT_DIRECTORY, 'docs', 'EXERCISE_MEDIA_SPEC.md');

const DEFAULT_ATTEMPTS_PER_EXERCISE = 3;
const DEFAULT_CONCURRENCY = 3;

// -----------------------------------------------------------------------------
// The prompt
// -----------------------------------------------------------------------------

function describeMuscleGroupList(muscleGroups) {
  return muscleGroups.length === 0 ? 'none' : muscleGroups.join(', ');
}

function buildPromptForExercise(exercise, specification, exemplar, previousFailures) {
  const { mediaBrief } = exercise;

  const retryNote =
    previousFailures.length === 0
      ? ''
      : `\nYOUR PREVIOUS ATTEMPT WAS REJECTED BY THE VALIDATOR. Fix exactly these and change
nothing else:

${previousFailures.map((failure) => `  - ${failure}`).join('\n')}
`;

  return `You are drawing one exercise animation for a personal training app. It is a single
self-contained animated SVG file. Reply with the SVG source and nothing else: no
explanation, no markdown code fence, no commentary before or after.

===============================================================================
THE CONTRACT. Every rule here is checked by an automated validator, and anything
that breaks one is thrown away.
===============================================================================

${specification}

===============================================================================
THE EXEMPLAR. This file is the house style. Match its construction exactly: the
same joint rig, the same segment shapes, the same stroke weights, the same
proportions, the same way of laying a scene out on the canvas. Your file should
look like it was drawn by the same hand on the same day.
===============================================================================

${exemplar}

===============================================================================
THE EXERCISE YOU ARE DRAWING
===============================================================================

File name:            ${exercise.exerciseId}.svg
Title element:        ${exercise.displayName}
Movement pattern:     ${exercise.movementPattern}

Start position:       ${mediaBrief.startPosition}
End position:         ${mediaBrief.endPosition}
Equipment to draw:    ${mediaBrief.equipmentToDraw}

Highlight with --muscle-highlight-primary:    ${describeMuscleGroupList(
    exercise.primaryMuscleGroups,
  )}
Highlight with --muscle-highlight-secondary:  ${describeMuscleGroupList(
    exercise.secondaryMuscleGroups,
  )}

The form this animation has to teach:
${exercise.formCues.map((cue) => `  - ${cue}`).join('\n')}

Do not draw any of these, which are the ways the movement goes wrong:
${exercise.commonMistakes.map((mistake) => `  - ${mistake}`).join('\n')}
${retryNote}
===============================================================================

Think about the joint angles before you write anything. Work out where each
joint sits at the start of the rep and at the end of it, then write those two
numbers into the keyframes. An animation whose angles were guessed teaches the
wrong movement, which is worse than showing no picture at all.

Reply with the SVG source only.`;
}

// -----------------------------------------------------------------------------
// Running codex
// -----------------------------------------------------------------------------

/**
 * Pulls the SVG out of whatever codex replied with.
 *
 * It is asked for bare SVG source and usually obliges, but a stray markdown
 * fence or a sentence of preamble should not cost an otherwise good drawing.
 */
function extractSvgSource(replyText) {
  const openingTagIndex = replyText.indexOf('<svg');
  const closingTagIndex = replyText.lastIndexOf('</svg>');

  if (openingTagIndex === -1 || closingTagIndex === -1) {
    return null;
  }

  return `${replyText.slice(openingTagIndex, closingTagIndex + '</svg>'.length)}\n`;
}

function runCodex(prompt, outputFilePath, workingDirectory) {
  return new Promise((resolve, reject) => {
    // One command string rather than an argument array: `codex` is a .cmd shim on
    // Windows, which Node cannot execute without a shell, and passing an argument
    // array alongside `shell: true` is deprecated. Every value interpolated here
    // is a path this script made itself.
    const command = [
      'codex exec',
      '--ephemeral',
      '--skip-git-repo-check',
      '--color never',
      '--sandbox read-only',
      `--cd "${workingDirectory}"`,
      `--output-last-message "${outputFilePath}"`,
      '-',
    ].join(' ');

    const codexProcess = spawn(command, {
      shell: true,
      stdio: ['pipe', 'ignore', 'pipe'],
    });

    let standardError = '';

    codexProcess.stderr.on('data', (chunk) => {
      standardError += chunk.toString();
    });

    codexProcess.on('error', reject);

    codexProcess.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolve();

        return;
      }

      reject(new Error(`codex exited with code ${exitCode}. ${standardError.trim()}`));
    });

    codexProcess.stdin.end(prompt);
  });
}

// -----------------------------------------------------------------------------
// Generating one exercise
// -----------------------------------------------------------------------------

async function generateOneExercise(exercise, specification, exemplar, options) {
  const scratchDirectory = await mkdtemp(join(tmpdir(), `exercise-media-${exercise.exerciseId}-`));
  const replyFilePath = join(scratchDirectory, 'reply.txt');

  let previousFailures = [];

  try {
    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
      const prompt = buildPromptForExercise(exercise, specification, exemplar, previousFailures);

      try {
        await runCodex(prompt, replyFilePath, scratchDirectory);
      } catch (error) {
        console.error(
          `  ${exercise.exerciseId}: attempt ${attempt} failed to run — ${error.message}`,
        );
        continue;
      }

      const replyText = await readFile(replyFilePath, 'utf8').catch(() => '');
      const svgSource = extractSvgSource(replyText);

      if (svgSource === null) {
        previousFailures = ['Your reply contained no SVG at all. Reply with the SVG source only.'];
        console.error(`  ${exercise.exerciseId}: attempt ${attempt} returned no SVG`);
        continue;
      }

      const failures = validateExerciseSvgSource(svgSource);

      if (failures.length === 0) {
        await writeFile(buildMediaFilePathForExercise(exercise.exerciseId), svgSource, 'utf8');
        console.log(`  ${exercise.exerciseId}: written on attempt ${attempt}`);

        return { exerciseId: exercise.exerciseId, wasWritten: true };
      }

      previousFailures = failures;
      console.error(
        `  ${exercise.exerciseId}: attempt ${attempt} broke the contract — ` +
          `${failures.length} failure${failures.length === 1 ? '' : 's'}`,
      );
    }

    console.error(`  ${exercise.exerciseId}: GIVING UP after ${options.attempts} attempts`);
    for (const failure of previousFailures) {
      console.error(`      ${failure}`);
    }

    return { exerciseId: exercise.exerciseId, wasWritten: false, failures: previousFailures };
  } finally {
    await rm(scratchDirectory, { recursive: true, force: true });
  }
}

/** Runs the generator over a list of exercises, a few at a time. */
async function generateInParallel(exercises, specification, exemplar, options) {
  const queue = [...exercises];
  const results = [];

  const worker = async () => {
    for (;;) {
      const exercise = queue.shift();

      if (exercise === undefined) {
        return;
      }

      results.push(await generateOneExercise(exercise, specification, exemplar, options));
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(options.concurrency, exercises.length) }, worker),
  );

  return results;
}

// -----------------------------------------------------------------------------
// Command line
// -----------------------------------------------------------------------------

/** The flags that take a value, so that value is not mistaken for an exercise id. */
const FLAGS_TAKING_A_VALUE = ['--limit', '--attempts', '--concurrency'];

function readNumericFlag(commandLineArguments, flagName, fallbackValue) {
  const flagIndex = commandLineArguments.indexOf(flagName);

  if (flagIndex === -1) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(commandLineArguments[flagIndex + 1] ?? '', 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
}

/** Everything that is not a flag and not a flag's value. */
function readExerciseIds(commandLineArguments) {
  const exerciseIds = [];

  for (let index = 0; index < commandLineArguments.length; index += 1) {
    const argument = commandLineArguments[index];

    if (FLAGS_TAKING_A_VALUE.includes(argument)) {
      index += 1;
      continue;
    }

    if (!argument.startsWith('--')) {
      exerciseIds.push(argument);
    }
  }

  return exerciseIds;
}

async function fileAlreadyExists(filePath) {
  return readFile(filePath).then(
    () => true,
    () => false,
  );
}

let exitCode = 0;

async function main() {
  const commandLineArguments = argv.slice(2);
  const exerciseIds = readExerciseIds(commandLineArguments);
  const shouldGenerateEverything = commandLineArguments.includes('--all');

  const options = {
    attempts: readNumericFlag(commandLineArguments, '--attempts', DEFAULT_ATTEMPTS_PER_EXERCISE),
    concurrency: readNumericFlag(commandLineArguments, '--concurrency', DEFAULT_CONCURRENCY),
    shouldOverwrite: commandLineArguments.includes('--overwrite'),
    isDryRun: commandLineArguments.includes('--dry-run'),
  };

  const limit = readNumericFlag(commandLineArguments, '--limit', Number.POSITIVE_INFINITY);

  if (!shouldGenerateEverything && exerciseIds.length === 0) {
    console.error(
      'Name an exercise id, or pass --all.\n' +
        '  node tools/exercise-media/generateExerciseSvg.mjs seatedCableRow\n' +
        '  node tools/exercise-media/generateExerciseSvg.mjs --all',
    );
    exitCode = 1;

    return;
  }

  const specification = await readFile(SPECIFICATION_FILE_PATH, 'utf8');
  const exemplar = await readFile(join(EXERCISE_MEDIA_DIRECTORY, EXEMPLAR_FILE_NAME), 'utf8');

  let exercises;

  if (shouldGenerateEverything) {
    exercises = await loadExercisesInGenerationPriorityOrder();
  } else {
    exercises = [];

    for (const exerciseId of exerciseIds) {
      const exercise = await findExerciseById(exerciseId);

      if (exercise === null) {
        console.error(`No exercise is defined with the id "${exerciseId}".`);
        exitCode = 1;

        return;
      }

      exercises.push(exercise);
    }
  }

  if (!options.shouldOverwrite) {
    const alreadyDrawn = [];

    for (const exercise of exercises) {
      if (await fileAlreadyExists(buildMediaFilePathForExercise(exercise.exerciseId))) {
        alreadyDrawn.push(exercise.exerciseId);
      }
    }

    if (alreadyDrawn.length > 0) {
      console.log(`Skipping ${alreadyDrawn.length} already drawn. Pass --overwrite to redraw.`);
      exercises = exercises.filter((exercise) => !alreadyDrawn.includes(exercise.exerciseId));
    }
  }

  if (Number.isFinite(limit)) {
    exercises = exercises.slice(0, limit);
  }

  if (exercises.length === 0) {
    console.log('Nothing to draw.');

    return;
  }

  if (options.isDryRun) {
    console.log(buildPromptForExercise(exercises[0], specification, exemplar, []));

    return;
  }

  console.log(
    `Drawing ${exercises.length} exercise${exercises.length === 1 ? '' : 's'}, ` +
      `${options.concurrency} at a time:`,
  );

  const results = await generateInParallel(exercises, specification, exemplar, options);
  const writtenCount = results.filter((result) => result.wasWritten).length;

  console.log(`\n${writtenCount} of ${results.length} written.`);

  if (writtenCount < results.length) {
    exitCode = 1;
  }
}

await main();

// Set rather than called, so that everything already written to stdout is flushed
// before the process ends.
process.exitCode = exitCode;
