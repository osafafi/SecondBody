import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { APP_ICON_PALETTE, appIconGeometry, buildAppIconShapes } from './appIconArtwork.mjs';
import { REPOSITORY_ROOT_DIRECTORY } from './appIconOutputs.mjs';
import { renderAppIcon } from './generateAppIcons.mjs';
import { decodePngToRgba, encodeRgbaAsPng } from './pngCodec.mjs';
import { rasteriseShapes } from './rasteriser.mjs';
import { findAppIconProblems } from './verifyAppIcons.mjs';

describe('pngCodec', () => {
  it('round-trips the pixels it was given', () => {
    const rgbaPixels = Buffer.from([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 9, 9, 9, 0]);

    expect(decodePngToRgba(encodeRgbaAsPng(rgbaPixels, 2, 2))).toEqual({
      rgbaPixels,
      widthInPixels: 2,
      heightInPixels: 2,
    });
  });

  it('refuses a pixel buffer that is not the size it was told', () => {
    expect(() => encodeRgbaAsPng(Buffer.alloc(8), 2, 2)).toThrow(/16 bytes/);
  });

  it('refuses a file that is not a PNG at all', () => {
    expect(() => decodePngToRgba(Buffer.from('this is not a png'))).toThrow(/signature/);
  });
});

describe('the app icon artwork', () => {
  /**
   * The icon is baked at build time and the palette is switched at runtime, so
   * the icon can only be one of them — the default. `APP_ICON_PALETTE` copies
   * those values because a build tool cannot import a TypeScript module, and
   * this is the test that stops the copy going stale.
   */
  it('uses the same colours as the default palette', async () => {
    const paletteSource = await readFile(
      join(REPOSITORY_ROOT_DIRECTORY, 'src', 'theme', 'palettes', 'purpleBluePalette.ts'),
      'utf8',
    );

    const declaredColors = Object.fromEntries(
      [...paletteSource.matchAll(/(\w+): *'(#[0-9A-Fa-f]{6})'/g)].map((match) => [
        match[1],
        match[2],
      ]),
    );

    for (const [colorName, iconHex] of Object.entries(APP_ICON_PALETTE)) {
      expect(declaredColors, `purpleBluePalette.ts declares no ${colorName}`).toHaveProperty(
        colorName,
      );
      expect(declaredColors[colorName], `${colorName} has drifted from the palette`).toBe(iconHex);
    }
  });

  it('rejects a variant it does not know how to draw', () => {
    expect(() => buildAppIconShapes('circular')).toThrow(/Unknown app icon variant/);
  });

  /**
   * Android crops a maskable icon to whatever shape the launcher prefers, and
   * only guarantees the middle 80% survives. This renders the icon and measures
   * how far the mark actually reaches, rather than trusting the arithmetic in
   * the artwork — a chevron that grew would fail here.
   */
  it('keeps the maskable mark inside Android’s safe zone', () => {
    const SAFE_ZONE_RADIUS = 0.4;
    const sizeInPixels = 96;
    const rgbaPixels = rasteriseShapes(buildAppIconShapes('maskable'), sizeInPixels);

    // The background is near-black in both palette stops; every part of the mark
    // is far brighter than this, so one threshold separates the two cleanly.
    const BACKGROUND_CHANNEL_CEILING = 0x60;
    let furthestMarkPixelRadius = 0;

    for (let pixelY = 0; pixelY < sizeInPixels; pixelY += 1) {
      for (let pixelX = 0; pixelX < sizeInPixels; pixelX += 1) {
        const offset = (pixelY * sizeInPixels + pixelX) * 4;
        const brightestChannel = Math.max(
          rgbaPixels[offset],
          rgbaPixels[offset + 1],
          rgbaPixels[offset + 2],
        );

        if (brightestChannel > BACKGROUND_CHANNEL_CEILING) {
          const x = (pixelX + 0.5) / sizeInPixels;
          const y = (pixelY + 0.5) / sizeInPixels;

          furthestMarkPixelRadius = Math.max(furthestMarkPixelRadius, Math.hypot(x - 0.5, y - 0.5));
        }
      }
    }

    expect(furthestMarkPixelRadius).toBeGreaterThan(0.2); // It drew something.
    expect(furthestMarkPixelRadius).toBeLessThanOrEqual(SAFE_ZONE_RADIUS);
  });

  it('draws the ring larger when it is not being cropped', () => {
    const { RING_RADIUS, RING_HALF_WIDTH, MASKABLE_MARK_SCALE } = appIconGeometry;

    expect(MASKABLE_MARK_SCALE).toBeLessThan(1);
    expect((RING_RADIUS + RING_HALF_WIDTH) * MASKABLE_MARK_SCALE).toBeLessThanOrEqual(0.4);
  });
});

describe('findAppIconProblems', () => {
  const singleOutput = [{ fileName: 'icon-192.png', sizeInPixels: 192, variant: 'rounded' }];

  function encodeCurrentArtwork(output) {
    return encodeRgbaAsPng(renderAppIcon(output), output.sizeInPixels, output.sizeInPixels);
  }

  it('accepts a committed icon that matches the artwork', async () => {
    const problems = await findAppIconProblems({
      outputs: singleOutput,
      readCommittedIcon: () => Promise.resolve(encodeCurrentArtwork(singleOutput[0])),
    });

    expect(problems).toEqual([]);
  });

  it('catches an icon that was never generated', async () => {
    const problems = await findAppIconProblems({
      outputs: singleOutput,
      readCommittedIcon: () => Promise.reject(new Error('ENOENT')),
    });

    expect(problems).toEqual([expect.stringContaining('is missing')]);
  });

  it('catches an icon committed at the wrong size', async () => {
    const problems = await findAppIconProblems({
      outputs: singleOutput,
      readCommittedIcon: () =>
        Promise.resolve(encodeCurrentArtwork({ sizeInPixels: 64, variant: 'rounded' })),
    });

    expect(problems).toEqual([expect.stringContaining('but the manifest asks for 192x192')]);
  });

  /** The one that matters: the artwork moved and nobody re-ran the generator. */
  it('catches an icon whose artwork has moved on without it', async () => {
    const problems = await findAppIconProblems({
      outputs: singleOutput,
      readCommittedIcon: () =>
        Promise.resolve(encodeCurrentArtwork({ sizeInPixels: 192, variant: 'maskable' })),
    });

    expect(problems).toEqual([expect.stringContaining('does not match the current artwork')]);
  });
});

/**
 * The check `npm run icons:verify` runs, run again from the test suite so that
 * `npm run verify` catches a stale icon before a commit rather than in CI. The
 * exercise media verifier is covered the same way and for the same reason.
 */
describe('the committed app icons', () => {
  it('are the ones the current artwork draws', async () => {
    expect(await findAppIconProblems()).toEqual([]);
  });
});
