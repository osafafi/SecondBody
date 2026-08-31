import type { ColorPaletteDefinition } from '../colorPaletteTypes';

/**
 * Warm and high-energy. Near-black backgrounds with an amber-to-crimson brand
 * gradient.
 *
 * Danger normally lives in exactly this colour range, so here it moves to a
 * pink-magenta that reads as an alarm rather than as brand furniture. Warning
 * moves to yellow for the same reason.
 */
export const amberCrimsonPalette: ColorPaletteDefinition = {
  paletteId: 'amberCrimson',
  displayName: 'Amber Crimson',

  brandGradientStart: '#F59E0B',
  brandGradientEnd: '#E11D48',

  accentGradientStart: '#FB923C',
  accentGradientEnd: '#DB2777',

  backgroundDeep: '#120A08',
  backgroundElevated: '#231311',
  surfaceTintRgb: '245, 158, 11',

  textPrimary: '#F7EDE6',
  textSecondary: '#C7ADA0',
  textMuted: '#8E7469',

  successGradientStart: '#34D399',
  successGradientEnd: '#10B981',
  warningGradientStart: '#FDE047',
  warningGradientEnd: '#EAB308',
  dangerGradientStart: '#F472B6',
  dangerGradientEnd: '#BE185D',

  muscleBodyFill: '#2A1815',
  muscleBodyStroke: '#6B4A3D',
  muscleHighlightPrimary: '#FB923C',
  muscleHighlightSecondary: '#E11D48',
  muscleEquipmentFill: '#331D19',
  muscleEquipmentStroke: '#7C574A',
  muscleMotionTrail: '#F59E0B',
};
