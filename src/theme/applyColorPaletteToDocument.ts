import { NON_COLOR_PALETTE_FIELDS, type ColorPaletteDefinition } from './colorPaletteTypes';

/**
 * Converts a palette field name into the CSS custom property name that CSS
 * Modules read.
 *
 *   brandGradientStart  ->  --brand-gradient-start
 *   surfaceTintRgb      ->  --surface-tint-rgb
 *
 * Pure and exported so it can be tested directly. Getting this wrong silently
 * produces an app with no colours, which is worth a unit test.
 */
export function convertPaletteFieldNameToCssCustomPropertyName(fieldName: string): string {
  const kebabCased = fieldName.replace(
    /[A-Z]/g,
    (uppercaseLetter) => `-${uppercaseLetter.toLowerCase()}`,
  );

  return `--${kebabCased}`;
}

/**
 * Writes every colour in the palette onto the document root as a CSS custom
 * property, replacing whatever was there before.
 *
 * This is the single point at which a palette becomes visible. Nothing else in
 * the app sets a colour.
 *
 * @param palette The palette to apply.
 * @param targetElement Overridable for tests. Defaults to `:root`.
 */
export function applyColorPaletteToDocument(
  palette: ColorPaletteDefinition,
  targetElement: HTMLElement = document.documentElement,
): void {
  const skippedFields = new Set<string>(NON_COLOR_PALETTE_FIELDS);

  for (const [fieldName, fieldValue] of Object.entries(palette)) {
    if (skippedFields.has(fieldName)) {
      continue;
    }

    targetElement.style.setProperty(
      convertPaletteFieldNameToCssCustomPropertyName(fieldName),
      fieldValue,
    );
  }

  // Lets CSS and any future code branch on the active palette without having to
  // read every custom property back out.
  targetElement.dataset['palette'] = palette.paletteId;
}
