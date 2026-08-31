/**
 * Where the chosen palette is remembered.
 *
 * **This is the cache, not the source of truth.** Since M8 the preference is
 * stored against the account in `settings/current`, so it follows him between
 * devices; `useStoredColorPaletteSync` reconciles the two once per launch and
 * the account wins.
 *
 * localStorage stays because it is the only one of the two that can be read
 * synchronously during the first render. Without it the app paints in the
 * default colours and then flips, because Firestore has not answered yet.
 *
 * Every access is wrapped, because localStorage throws rather than returning
 * null in private browsing on some platforms. A palette preference is never
 * worth crashing the app over.
 */

const COLOR_PALETTE_PREFERENCE_STORAGE_KEY = 'secondBody.selectedPaletteId';

export function readStoredColorPaletteId(): string | null {
  try {
    return window.localStorage.getItem(COLOR_PALETTE_PREFERENCE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredColorPaletteId(paletteId: string): void {
  try {
    window.localStorage.setItem(COLOR_PALETTE_PREFERENCE_STORAGE_KEY, paletteId);
  } catch {
    // Preference simply will not persist. The app still works.
  }
}
