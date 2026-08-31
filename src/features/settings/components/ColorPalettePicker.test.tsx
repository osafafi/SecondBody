import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ColorPaletteProvider } from '@/theme/ColorPaletteProvider';
import { availableColorPalettes } from '@/theme/palettes/availableColorPalettes';
import { purpleBluePalette } from '@/theme/palettes/purpleBluePalette';

import { ColorPalettePicker } from './ColorPalettePicker';

function renderPickerInsideProvider(onPaletteSelected: (paletteId: string) => void = () => {}) {
  return render(
    <ColorPaletteProvider>
      <ColorPalettePicker onPaletteSelected={onPaletteSelected} />
    </ColorPaletteProvider>,
  );
}

/** The first palette in the registry that is not the default. */
function findFirstNonDefaultPalette() {
  const palette = availableColorPalettes.find(
    (candidate) => candidate.paletteId !== purpleBluePalette.paletteId,
  );

  if (!palette) {
    throw new Error('Expected the registry to contain a palette other than the default.');
  }

  return palette;
}

describe('ColorPalettePicker', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('style');
    delete document.documentElement.dataset['palette'];
  });

  it('lists every registered palette', () => {
    renderPickerInsideProvider();

    for (const palette of availableColorPalettes) {
      expect(
        screen.getByRole('button', { name: new RegExp(palette.displayName) }),
      ).toBeInTheDocument();
    }
  });

  it('starts on the default palette', () => {
    renderPickerInsideProvider();

    expect(
      screen.getByRole('button', { name: new RegExp(purpleBluePalette.displayName) }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies the chosen palette to the document', async () => {
    const user = userEvent.setup();
    const targetPalette = findFirstNonDefaultPalette();

    renderPickerInsideProvider();
    await user.click(screen.getByRole('button', { name: new RegExp(targetPalette.displayName) }));

    expect(document.documentElement.dataset['palette']).toBe(targetPalette.paletteId);
    expect(document.documentElement.style.getPropertyValue('--brand-gradient-start')).toBe(
      targetPalette.brandGradientStart,
    );
  });

  it('remembers the choice, so it survives a reload', async () => {
    const user = userEvent.setup();
    const targetPalette = findFirstNonDefaultPalette();

    const { unmount } = renderPickerInsideProvider();
    await user.click(screen.getByRole('button', { name: new RegExp(targetPalette.displayName) }));
    unmount();

    renderPickerInsideProvider();

    expect(
      screen.getByRole('button', { name: new RegExp(targetPalette.displayName) }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  /*
   * The palette is stored twice: in localStorage by the theme provider, and
   * against the account by whoever is listening here. This is the half that
   * makes it follow him to another device.
   */
  it('reports the choice so the screen can store it against the account', async () => {
    const user = userEvent.setup();
    const targetPalette = findFirstNonDefaultPalette();
    const handlePaletteSelected = vi.fn();

    renderPickerInsideProvider(handlePaletteSelected);
    await user.click(screen.getByRole('button', { name: new RegExp(targetPalette.displayName) }));

    expect(handlePaletteSelected).toHaveBeenCalledWith(targetPalette.paletteId);
  });

  it('falls back to the default when the stored palette id is no longer recognised', () => {
    window.localStorage.setItem('secondBody.selectedPaletteId', 'aPaletteThatWasDeleted');

    renderPickerInsideProvider();

    expect(
      screen.getByRole('button', { name: new RegExp(purpleBluePalette.displayName) }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
