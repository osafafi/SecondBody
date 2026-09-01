/**
 * Every icon file this project ships, and which variant and size it is.
 *
 * One list, read by the generator and by the verifier, so a file can never be
 * written by one and forgotten by the other.
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath` is handed a string, not a URL object. Under Vitest's jsdom
// environment the global `URL` is jsdom's, and Node does not recognise one of
// those as a file URL — the same reason `exerciseMediaDataset.mjs` resolves
// paths this way.
const thisDirectory = dirname(fileURLToPath(import.meta.url));

export const REPOSITORY_ROOT_DIRECTORY = resolve(thisDirectory, '..', '..');
export const APP_ICON_DIRECTORY = join(REPOSITORY_ROOT_DIRECTORY, 'public', 'icons');

/**
 * Sizes are the ones that are actually asked for:
 *
 * - 192 and 512 are what the web app manifest specification names, and what
 *   Chrome's install prompt requires before it will offer to install anything.
 * - 180 is the size iOS reads for `apple-touch-icon`.
 * - 96 and 32 are the favicon: 32 for the tab, 96 for the bookmark bar and for
 *   Windows' taskbar, which upscales anything smaller into mush.
 */
export const APP_ICON_OUTPUTS = [
  { fileName: 'icon-192.png', sizeInPixels: 192, variant: 'rounded' },
  { fileName: 'icon-512.png', sizeInPixels: 512, variant: 'rounded' },
  { fileName: 'icon-maskable-192.png', sizeInPixels: 192, variant: 'maskable' },
  { fileName: 'icon-maskable-512.png', sizeInPixels: 512, variant: 'maskable' },
  { fileName: 'apple-touch-icon-180.png', sizeInPixels: 180, variant: 'fullBleed' },
  { fileName: 'favicon-96.png', sizeInPixels: 96, variant: 'rounded' },
  { fileName: 'favicon-32.png', sizeInPixels: 32, variant: 'rounded' },
];

export function buildAppIconFilePath(fileName) {
  return join(APP_ICON_DIRECTORY, fileName);
}
