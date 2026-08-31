import type { ColorPaletteDefinition } from '../colorPaletteTypes';

/**
 * Cooler, calmer alternative to the default. Deep teal backgrounds with an
 * emerald-to-cyan brand gradient.
 *
 * Note that success stays green here, which would collide with the brand
 * gradient, so success shifts towards lime to remain distinguishable. Semantic
 * colours have to stay readable as signals in every palette.
 */
export const emeraldTealPalette: ColorPaletteDefinition = {
  paletteId: 'emeraldTeal',
  displayName: 'Emerald Teal',

  brandGradientStart: '#10B981',
  brandGradientEnd: '#0EA5E9',

  accentGradientStart: '#2DD4BF',
  accentGradientEnd: '#3B82F6',

  backgroundDeep: '#050F12',
  backgroundElevated: '#0C1F24',
  surfaceTintRgb: '45, 212, 191',

  textPrimary: '#E6F5F1',
  textSecondary: '#9CBDB8',
  textMuted: '#648984',

  successGradientStart: '#A3E635',
  successGradientEnd: '#65A30D',
  warningGradientStart: '#FBBF24',
  warningGradientEnd: '#F59E0B',
  dangerGradientStart: '#FB7185',
  dangerGradientEnd: '#E11D48',
};
