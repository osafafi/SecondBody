#!/usr/bin/env node
/**
 * Draws the app icons into `public/icons/`.
 *
 * ```bash
 * npm run icons:generate
 * ```
 *
 * The output is committed. This does not run in the build — it runs when the
 * artwork changes, and `npm run icons:verify` is what makes sure somebody
 * remembered to run it.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { buildAppIconShapes } from './appIconArtwork.mjs';
import { APP_ICON_DIRECTORY, APP_ICON_OUTPUTS, buildAppIconFilePath } from './appIconOutputs.mjs';
import { encodeRgbaAsPng } from './pngCodec.mjs';
import { rasteriseShapes } from './rasteriser.mjs';

/** Renders one output. Shared with the verifier, which renders the same thing to compare. */
export function renderAppIcon({ sizeInPixels, variant }) {
  return rasteriseShapes(buildAppIconShapes(variant), sizeInPixels);
}

async function main() {
  await mkdir(APP_ICON_DIRECTORY, { recursive: true });

  for (const output of APP_ICON_OUTPUTS) {
    const rgbaPixels = renderAppIcon(output);
    const pngBytes = encodeRgbaAsPng(rgbaPixels, output.sizeInPixels, output.sizeInPixels);

    await writeFile(buildAppIconFilePath(output.fileName), pngBytes);

    console.log(
      `${output.fileName.padEnd(26)} ${String(output.sizeInPixels).padStart(3)}px  ` +
        `${output.variant.padEnd(9)} ${String(Math.round(pngBytes.length / 1024))} KB`,
    );
  }

  console.log(`\n${String(APP_ICON_OUTPUTS.length)} icons written to public/icons/.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
