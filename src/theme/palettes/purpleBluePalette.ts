import type { ColorPaletteDefinition } from '../colorPaletteTypes';

/**
 * The default palette, and the one the app was designed against.
 *
 * Deep violet backgrounds with a violet-to-blue brand gradient. Everything else
 * is tuned so that body text clears 4.5:1 contrast against the translucent
 * surfaces it actually sits on, not just against the deepest background.
 */
export const purpleBluePalette: ColorPaletteDefinition = {
  paletteId: 'purpleBlue',
  displayName: 'Purple Blue',

  brandGradientStart: '#7C5CFF',
  brandGradientEnd: '#3D8BFF',

  accentGradientStart: '#A855F7',
  accentGradientEnd: '#6366F1',

  backgroundDeep: '#0B0A14',
  backgroundElevated: '#131126',
  surfaceTintRgb: '124, 92, 255',

  textPrimary: '#ECE9F6',
  textSecondary: '#A9A3C7',
  textMuted: '#6F6992',

  successGradientStart: '#34D399',
  successGradientEnd: '#10B981',
  warningGradientStart: '#FBBF24',
  warningGradientEnd: '#F59E0B',
  dangerGradientStart: '#FB7185',
  dangerGradientEnd: '#E11D48',

  muscleBodyFill: '#1C1934',
  muscleBodyStroke: '#4A4470',
  muscleHighlightPrimary: '#A855F7',
  muscleHighlightSecondary: '#3D8BFF',
  muscleEquipmentFill: '#241F42',
  muscleEquipmentStroke: '#5A5385',
  muscleMotionTrail: '#7C5CFF',
};
