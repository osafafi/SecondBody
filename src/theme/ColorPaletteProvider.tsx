import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { applyColorPaletteToDocument } from './applyColorPaletteToDocument';
import { ColorPaletteContext, type ColorPaletteContextValue } from './colorPaletteContext';
import {
  readStoredColorPaletteId,
  writeStoredColorPaletteId,
} from './colorPalettePreferenceStorage';
import {
  availableColorPalettes,
  findColorPaletteByIdOrDefault,
} from './palettes/availableColorPalettes';

type ColorPaletteProviderProps = {
  children: ReactNode;
};

/**
 * Applies the chosen colour palette to the document and lets any screen change
 * it.
 *
 * The initial palette is resolved during the first render rather than in an
 * effect, so the app never paints once in the default colours and then flips.
 */
export function ColorPaletteProvider({ children }: ColorPaletteProviderProps) {
  const [selectedColorPaletteId, setSelectedColorPaletteId] = useState<string>(
    () => findColorPaletteByIdOrDefault(readStoredColorPaletteId()).paletteId,
  );

  const selectedColorPalette = useMemo(
    () => findColorPaletteByIdOrDefault(selectedColorPaletteId),
    [selectedColorPaletteId],
  );

  useEffect(() => {
    applyColorPaletteToDocument(selectedColorPalette);
  }, [selectedColorPalette]);

  const selectColorPaletteById = useCallback((paletteId: string) => {
    // Resolve before storing, so an unknown id can never be persisted.
    const resolvedPalette = findColorPaletteByIdOrDefault(paletteId);

    setSelectedColorPaletteId(resolvedPalette.paletteId);
    writeStoredColorPaletteId(resolvedPalette.paletteId);
  }, []);

  const contextValue = useMemo<ColorPaletteContextValue>(
    () => ({
      selectedColorPalette,
      availableColorPalettes,
      selectColorPaletteById,
    }),
    [selectedColorPalette, selectColorPaletteById],
  );

  return (
    <ColorPaletteContext.Provider value={contextValue}>{children}</ColorPaletteContext.Provider>
  );
}
