/**
 * The colour palette contract.
 *
 * A palette is the ONLY place colours are defined in this application. Every
 * component reads colours through CSS custom properties that these fields
 * produce, which is what makes the palette switcher in Settings work at runtime.
 *
 * Adding a palette means adding one file in `./palettes/` and registering it in
 * `./palettes/availableColorPalettes.ts`. Nothing else in the app changes.
 *
 * See docs/DESIGN_SYSTEM.md for the visual rules these colours have to serve.
 */

/**
 * Every field below (except `paletteId` and `displayName`) becomes a CSS custom
 * property on `:root`, with the name converted from camelCase to kebab-case.
 *
 * For example `brandGradientStart` becomes `--brand-gradient-start`.
 */
export type ColorPaletteDefinition = {
  /** Stable identifier. Persisted in settings, so never change one after release. */
  paletteId: string;

  /** Shown in the Settings palette picker. */
  displayName: string;

  // ---------------------------------------------------------------------------
  // Brand
  // ---------------------------------------------------------------------------

  /** Primary gradient. The app's identity: primary buttons, active states. */
  brandGradientStart: string;
  brandGradientEnd: string;

  /** Secondary gradient, for highlights that must not compete with the primary. */
  accentGradientStart: string;
  accentGradientEnd: string;

  // ---------------------------------------------------------------------------
  // Backgrounds
  // ---------------------------------------------------------------------------

  /** The page behind everything. The darkest colour in the palette. */
  backgroundDeep: string;

  /** The base colour that panels are built on top of. */
  backgroundElevated: string;

  /**
   * The tint mixed into every translucent surface, expressed as a bare
   * "r, g, b" triplet so it can be used inside rgba() with a variable alpha:
   *
   *   rgba(var(--surface-tint-rgb), 0.1)
   *
   * This is why it is not a hex value like everything else.
   */
  surfaceTintRgb: string;

  // ---------------------------------------------------------------------------
  // Text
  // ---------------------------------------------------------------------------

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // ---------------------------------------------------------------------------
  // Semantic gradients
  // ---------------------------------------------------------------------------

  successGradientStart: string;
  successGradientEnd: string;
  warningGradientStart: string;
  warningGradientEnd: string;
  dangerGradientStart: string;
  dangerGradientEnd: string;

  // ---------------------------------------------------------------------------
  // Exercise illustrations
  //
  // The generated exercise SVGs reference these as CSS custom properties rather
  // than baking in literal colours. That is what makes switching palette
  // recolour every exercise animation as well as the interface.
  //
  // The exhaustive list of properties an SVG may use is in
  // docs/EXERCISE_MEDIA_SPEC.md section 4. Keep the two in step.
  // ---------------------------------------------------------------------------

  muscleBodyFill: string;
  muscleBodyStroke: string;
  muscleHighlightPrimary: string;
  muscleHighlightSecondary: string;
  muscleEquipmentFill: string;
  muscleEquipmentStroke: string;
  muscleMotionTrail: string;
};

/**
 * The palette fields that are metadata rather than colours. These are skipped
 * when writing CSS custom properties to the document.
 */
export const NON_COLOR_PALETTE_FIELDS = ['paletteId', 'displayName'] as const;

export type NonColorPaletteField = (typeof NON_COLOR_PALETTE_FIELDS)[number];
