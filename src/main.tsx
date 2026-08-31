import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';
import { applyColorPaletteToDocument } from '@/theme/applyColorPaletteToDocument';
import { readStoredColorPaletteId } from '@/theme/colorPalettePreferenceStorage';
import { findColorPaletteByIdOrDefault } from '@/theme/palettes/availableColorPalettes';

import '@/theme/tokens.css';
import '@/styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find the #root element to mount the application into.');
}

// Apply the stored palette BEFORE React renders, so the app never paints once in
// fallback colours and then flips. The provider re-applies it on mount, which is
// harmless, and takes over from there whenever the palette is changed.
applyColorPaletteToDocument(findColorPaletteByIdOrDefault(readStoredColorPaletteId()));

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
