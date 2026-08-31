import { createContext } from 'react';

import type { ColorPaletteDefinition } from './colorPaletteTypes';

export type ColorPaletteContextValue = {
  /** The palette currently applied to the document. */
  selectedColorPalette: ColorPaletteDefinition;

  /** Every palette the user can choose from, for the Settings picker. */
  availableColorPalettes: readonly ColorPaletteDefinition[];

  /** Switches palette, applies it immediately and remembers the choice. */
  selectColorPaletteById: (paletteId: string) => void;
};

/**
 * Kept in its own file so that `ColorPaletteProvider.tsx` exports a component
 * and nothing else, and `useColorPalette.ts` exports a hook and nothing else.
 * React Fast Refresh only works reliably when a module's exports are all of one
 * kind.
 */
export const ColorPaletteContext = createContext<ColorPaletteContextValue | null>(null);
