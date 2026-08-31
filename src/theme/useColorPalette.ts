import { useContext } from 'react';

import { ColorPaletteContext, type ColorPaletteContextValue } from './colorPaletteContext';

/**
 * Reads the active colour palette and the function that changes it.
 *
 * Components almost never need this — colours reach them through CSS custom
 * properties instead. It exists for the Settings picker, and for the rare case
 * where a colour has to be passed to something that cannot read CSS, such as a
 * canvas or an SVG attribute computed in JavaScript.
 */
export function useColorPalette(): ColorPaletteContextValue {
  const contextValue = useContext(ColorPaletteContext);

  if (!contextValue) {
    throw new Error('useColorPalette must be used inside a <ColorPaletteProvider>.');
  }

  return contextValue;
}
