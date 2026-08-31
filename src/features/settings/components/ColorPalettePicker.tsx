import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { useColorPalette } from '@/theme/useColorPalette';

import styles from './ColorPalettePicker.module.css';

export type ColorPalettePickerProps = {
  /**
   * Called with the chosen palette so the screen can store it against the
   * account. The palette is applied to the document either way — persisting it
   * is a separate concern, and a Firestore write that fails must not stop the
   * colours changing.
   */
  onPaletteSelected: (paletteId: string) => void;
};

/**
 * Builds the inline custom properties that let a swatch preview a palette other
 * than the active one.
 *
 * Inline style is normally banned for colours in this codebase. This is the
 * documented exception: these colours belong to a palette that is not currently
 * applied to the document, so they cannot be read from CSS custom properties.
 */
function buildSwatchStyle(
  brandGradientStart: string,
  brandGradientEnd: string,
  backgroundDeep: string,
): CSSProperties {
  return {
    '--swatch-brand-start': brandGradientStart,
    '--swatch-brand-end': brandGradientEnd,
    '--swatch-background': backgroundDeep,
  } as CSSProperties;
}

/**
 * Lets Omar change the app's colour palette. The change applies immediately, to
 * every screen and to every exercise animation.
 *
 * The list is driven entirely by the palette registry, so adding a palette makes
 * it appear here with no change to this file.
 *
 * Two things happen on a tap, in this order: the palette is applied to the
 * document and cached in localStorage by the theme provider, and then the choice
 * is reported to the screen, which stores it against the account so it follows
 * him to another device. See `useStoredColorPaletteSync`.
 */
export function ColorPalettePicker({ onPaletteSelected }: ColorPalettePickerProps) {
  const { selectedColorPalette, availableColorPalettes, selectColorPaletteById } =
    useColorPalette();

  return (
    <GradientSurface as="ul" variant="elevated" className={styles.paletteList}>
      {availableColorPalettes.map((palette) => {
        const isSelected = palette.paletteId === selectedColorPalette.paletteId;

        return (
          <li key={palette.paletteId}>
            <button
              type="button"
              className={[styles.paletteOption, isSelected ? styles.isSelected : null]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                selectColorPaletteById(palette.paletteId);
                onPaletteSelected(palette.paletteId);
              }}
              aria-pressed={isSelected}
            >
              <span
                className={styles.swatch}
                style={buildSwatchStyle(
                  palette.brandGradientStart,
                  palette.brandGradientEnd,
                  palette.backgroundDeep,
                )}
                aria-hidden
              >
                <span className={styles.swatchCorner} />
              </span>

              <span className={styles.paletteText}>
                <span className={styles.paletteName}>{palette.displayName}</span>
                <span className={styles.paletteHint}>
                  {isSelected ? 'Currently active' : 'Tap to switch'}
                </span>
              </span>

              {isSelected ? (
                <Check className={styles.selectedIcon} size={20} strokeWidth={2.25} aria-hidden />
              ) : null}
            </button>
          </li>
        );
      })}
    </GradientSurface>
  );
}
