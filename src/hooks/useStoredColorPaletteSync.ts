import { useEffect } from 'react';

import { readUserSettings } from '@/services/repositories/userSettingsRepository';
import { useColorPalette } from '@/theme/useColorPalette';

/**
 * Brings the palette stored against the account into the running app.
 *
 * The palette is remembered in two places, and both are deliberate:
 *
 * - **localStorage** is read synchronously during the first render by
 *   `ColorPaletteProvider`, so the app never paints in the default colours and
 *   then flips. It cannot be Firestore, because Firestore has not answered yet
 *   at that point.
 * - **`settings/current`** is the source of truth, so the choice follows the
 *   account to a new phone, or to a browser that has never seen this app.
 *
 * This hook is what reconciles them: one read after sign-in, and if the account
 * disagrees with the cache, the account wins and the cache is corrected. On the
 * device where the choice was made they already agree and nothing happens.
 *
 * A failed read is swallowed on purpose. Falling back to the cached palette is
 * exactly right, and an error message about a colour scheme is noise on a screen
 * that has just finished asking somebody to sign in.
 */
export function useStoredColorPaletteSync(userId: string | null): void {
  const { selectColorPaletteById } = useColorPalette();

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let isCurrentRequest = true;

    const applyStoredColorPalette = async () => {
      try {
        const userSettings = await readUserSettings(userId);

        if (!isCurrentRequest) {
          return;
        }

        /*
         * Applied without first checking whether it differs. Setting the same
         * id is a no-op React bails out of, and the check would mean depending
         * on the active palette — which changes the instant this applies one,
         * re-reading the document every time somebody touched the picker.
         */
        selectColorPaletteById(userSettings.selectedPaletteId);
      } catch {
        // The cached palette stands. A colour preference is not worth an alert.
      }
    };

    void applyStoredColorPalette();

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, selectColorPaletteById]);
}
