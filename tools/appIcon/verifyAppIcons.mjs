#!/usr/bin/env node
/**
 * Checks that the committed icons are the ones the current artwork draws.
 *
 * ```bash
 * npm run icons:verify
 * ```
 *
 * The failure this exists to catch: somebody nudges a number in
 * `appIconArtwork.mjs`, reviews the diff, and never runs `npm run icons:generate`
 * — so the repository says one thing and the phone shows another. It runs in CI
 * for the same reason the exercise media verifier does.
 *
 * It compares **pixels rather than file bytes**, because zlib's exact output is
 * not guaranteed identical across Node versions and a byte comparison would fail
 * the build on a Node upgrade while the icons were in fact unchanged.
 */

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { APP_ICON_OUTPUTS, buildAppIconFilePath } from './appIconOutputs.mjs';
import { renderAppIcon } from './generateAppIcons.mjs';
import { decodePngToRgba } from './pngCodec.mjs';

/**
 * Everything wrong with the committed icons, as sentences.
 *
 * `readCommittedIcon` is injected so the tests can describe a repository
 * without writing files to one.
 */
export async function findAppIconProblems({
  outputs = APP_ICON_OUTPUTS,
  readCommittedIcon = async (fileName) => readFile(buildAppIconFilePath(fileName)),
} = {}) {
  const problems = [];

  for (const output of outputs) {
    let committedBytes;

    try {
      committedBytes = await readCommittedIcon(output.fileName);
    } catch {
      problems.push(
        `${output.fileName} is missing. Run \`npm run icons:generate\` and commit the result.`,
      );
      continue;
    }

    let committed;

    try {
      committed = decodePngToRgba(committedBytes);
    } catch (error) {
      problems.push(`${output.fileName} could not be read as a PNG: ${String(error)}`);
      continue;
    }

    if (
      committed.widthInPixels !== output.sizeInPixels ||
      committed.heightInPixels !== output.sizeInPixels
    ) {
      problems.push(
        `${output.fileName} is ${String(committed.widthInPixels)}x${String(committed.heightInPixels)}, ` +
          `but the manifest asks for ${String(output.sizeInPixels)}x${String(output.sizeInPixels)}.`,
      );
      continue;
    }

    if (!committed.rgbaPixels.equals(renderAppIcon(output))) {
      problems.push(
        `${output.fileName} does not match the current artwork. ` +
          'Run `npm run icons:generate` and commit the result.',
      );
    }
  }

  return problems;
}

async function main() {
  const problems = await findAppIconProblems();

  if (problems.length > 0) {
    console.error(`${String(problems.length)} problem(s) with the committed app icons:\n`);

    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(`${String(APP_ICON_OUTPUTS.length)} app icons match the committed artwork.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
