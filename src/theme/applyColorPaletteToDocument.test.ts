import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyColorPaletteToDocument,
  convertPaletteFieldNameToCssCustomPropertyName,
} from './applyColorPaletteToDocument';
import { availableColorPalettes } from './palettes/availableColorPalettes';
import { purpleBluePalette } from './palettes/purpleBluePalette';
import { NON_COLOR_PALETTE_FIELDS } from './colorPaletteTypes';

describe('convertPaletteFieldNameToCssCustomPropertyName', () => {
  it.each([
    ['brandGradientStart', '--brand-gradient-start'],
    ['surfaceTintRgb', '--surface-tint-rgb'],
    ['textPrimary', '--text-primary'],
    ['warningGradientStart', '--warning-gradient-start'],
    ['backgroundDeep', '--background-deep'],
  ])('converts %s to %s', (fieldName, expectedPropertyName) => {
    expect(convertPaletteFieldNameToCssCustomPropertyName(fieldName)).toBe(expectedPropertyName);
  });
});

describe('applyColorPaletteToDocument', () => {
  let targetElement: HTMLElement;

  beforeEach(() => {
    targetElement = document.createElement('div');
  });

  // One field from each group in the contract, rather than all twenty-odd: the
  // "defines every field on every palette" test below is what proves nothing is
  // missing, and this proves the values arrive intact and correctly named.
  it('writes every colour field as a CSS custom property', () => {
    applyColorPaletteToDocument(purpleBluePalette, targetElement);

    expect(targetElement.style.getPropertyValue('--brand-gradient-start')).toBe('#7C5CFF');
    expect(targetElement.style.getPropertyValue('--background-deep')).toBe('#0B0A14');
    expect(targetElement.style.getPropertyValue('--surface-tint-rgb')).toBe('124, 92, 255');
    expect(targetElement.style.getPropertyValue('--text-secondary')).toBe('#A9A3C7');
    expect(targetElement.style.getPropertyValue('--danger-gradient-end')).toBe('#E11D48');
  });

  it('does not write the metadata fields as custom properties', () => {
    applyColorPaletteToDocument(purpleBluePalette, targetElement);

    expect(targetElement.style.getPropertyValue('--palette-id')).toBe('');
    expect(targetElement.style.getPropertyValue('--display-name')).toBe('');
  });

  it('records the active palette id on the element', () => {
    applyColorPaletteToDocument(purpleBluePalette, targetElement);

    expect(targetElement.dataset['palette']).toBe('purpleBlue');
  });

  it('replaces the previous palette completely when switched', () => {
    const [firstPalette, secondPalette] = availableColorPalettes;

    // The registry is asserted to hold at least two palettes by the test below,
    // so this narrowing is safe.
    if (!firstPalette || !secondPalette) {
      throw new Error('Expected at least two palettes to be registered.');
    }

    applyColorPaletteToDocument(firstPalette, targetElement);
    applyColorPaletteToDocument(secondPalette, targetElement);

    expect(targetElement.style.getPropertyValue('--brand-gradient-start')).toBe(
      secondPalette.brandGradientStart,
    );
    expect(targetElement.dataset['palette']).toBe(secondPalette.paletteId);
  });
});

describe('the palette registry', () => {
  it('holds more than one palette, so the Settings picker is meaningful', () => {
    expect(availableColorPalettes.length).toBeGreaterThan(1);
  });

  it('gives every palette a unique id', () => {
    const paletteIds = availableColorPalettes.map((palette) => palette.paletteId);

    expect(new Set(paletteIds).size).toBe(paletteIds.length);
  });

  it('defines every field on every palette, so no palette renders a missing colour', () => {
    const expectedFieldNames = Object.keys(purpleBluePalette).sort();

    for (const palette of availableColorPalettes) {
      expect(Object.keys(palette).sort(), `palette "${palette.paletteId}"`).toEqual(
        expectedFieldNames,
      );
    }
  });

  it('uses a bare "r, g, b" triplet for the surface tint, because it is used inside rgba()', () => {
    for (const palette of availableColorPalettes) {
      expect(palette.surfaceTintRgb, `palette "${palette.paletteId}"`).toMatch(
        /^\d{1,3}, \d{1,3}, \d{1,3}$/,
      );
    }
  });

  it('uses hex values for every colour except the surface tint', () => {
    const fieldsThatAreNotHex = new Set<string>([...NON_COLOR_PALETTE_FIELDS, 'surfaceTintRgb']);

    for (const palette of availableColorPalettes) {
      for (const [fieldName, fieldValue] of Object.entries(palette)) {
        if (fieldsThatAreNotHex.has(fieldName)) {
          continue;
        }

        expect(fieldValue, `${palette.paletteId}.${fieldName}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
});
