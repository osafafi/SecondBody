/**
 * Where the chosen palette is remembered.
 *
 * TEMPORARY: this uses localStorage so the palette survives a reload before the
 * backend exists. Milestone M4 moves the preference into the user's Firestore
 * `settings/current` document so it follows him between devices, at which point
 * localStorage becomes a fast-path cache used to avoid a colour flash on load
 * rather than the source of truth.
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
