import type { ColorPaletteDefinition } from '../colorPaletteTypes';
import { amberCrimsonPalette } from './amberCrimsonPalette';
import { emeraldTealPalette } from './emeraldTealPalette';
import { purpleBluePalette } from './purpleBluePalette';

/**
 * The palette registry.
 *
 * To add a palette: create the file next to this one, import it, and add it to
 * this array. The Settings picker is driven by this list, so it appears
 * automatically. There is no other step.
 */
export const availableColorPalettes: readonly ColorPaletteDefinition[] = [
  purpleBluePalette,
  emeraldTealPalette,
  amberCrimsonPalette,
];

/** Used on first run, and whenever a stored palette id is no longer recognised. */
export const DEFAULT_COLOR_PALETTE_ID = purpleBluePalette.paletteId;

/**
 * Finds a palette by id, falling back to the default.
 *
 * The fallback matters: a stored palette id can outlive the palette itself if
 * one is ever removed. Falling back beats rendering an app with no colours.
 */
export function findColorPaletteByIdOrDefault(paletteId: string | null): ColorPaletteDefinition {
  const matchingPalette = availableColorPalettes.find((palette) => palette.paletteId === paletteId);

  if (matchingPalette) {
    return matchingPalette;
  }

  // The registry is never empty, but the type system cannot know that.
  return availableColorPalettes[0] ?? purpleBluePalette;
}
