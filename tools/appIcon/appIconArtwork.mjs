/**
 * The app icon, as geometry.
 *
 * This is the single source of truth. `generateAppIcons.mjs` rasterises it to
 * PNG and `svgRenderer.mjs` writes the same numbers out as SVG, so the favicon
 * and the home-screen icon cannot drift apart.
 *
 * **The mark is the rest timer's progress ring**, three-quarters round, with a
 * chevron climbing out of the middle of it. Those are the two things the app is
 * actually about — waiting out the rest properly, and the number going up — and
 * they are the two shapes already on the screen the most.
 */

import {
  arcShape,
  capsuleShape,
  fullSquareShape,
  linearGradientFillAtCssAngle,
  parseHexColor,
  solidFill,
  superellipseShape,
} from './rasteriser.mjs';

/**
 * Lifted from `src/theme/palettes/purpleBluePalette.ts`.
 *
 * An icon is baked at build time and a palette is switched at runtime, so the
 * icon can only ever be one of them: the default, the one the app was designed
 * against. Duplicated here because a `.mjs` build tool cannot import a `.ts`
 * module — and `appIconArtwork.test.mjs` reads both files and fails if these
 * ever stop matching, so the duplication cannot rot quietly.
 */
export const APP_ICON_PALETTE = {
  brandGradientStart: '#7C5CFF',
  brandGradientEnd: '#3D8BFF',
  backgroundDeep: '#0B0A14',
  backgroundElevated: '#131126',
  textPrimary: '#ECE9F6',
};

/** How much of the canvas the mark occupies, before any maskable shrinking. */
const RING_RADIUS = 0.335;
const RING_HALF_WIDTH = 0.056;

/**
 * Three-quarters of a turn, starting at twelve o'clock.
 *
 * A complete ring reads as the letter O. The gap is what makes it a *timer* —
 * and starting where a progress ring starts leaves it sitting in the top-left
 * quadrant, which is exactly where a rest three-quarters done would leave it.
 */
const RING_START_TURNS = 0;
const RING_SWEEP_TURNS = 0.75;

const CHEVRON_HALF_WIDTH = 0.053;
const CHEVRON_APEX_Y = 0.415;
const CHEVRON_FOOT_Y = 0.557;
const CHEVRON_HALF_SPAN = 0.118;

/**
 * Android masks a maskable icon to whatever shape the launcher likes, and only
 * the middle 80% is guaranteed to survive. Shrinking the mark to 76% keeps the
 * ring clear of a circular crop with a little room to spare.
 */
const MASKABLE_MARK_SCALE = 0.76;

function scaleAboutCentre(value, scale) {
  return 0.5 + (value - 0.5) * scale;
}

/**
 * The three shapes an icon has to be, because three platforms crop differently.
 *
 * | Variant      | Background         | Mark  | Used for                                    |
 * | ------------ | ------------------ | ----- | ------------------------------------------- |
 * | `rounded`    | squircle, corners transparent | full  | the manifest's `any` icons, and the favicon |
 * | `fullBleed`  | edge to edge       | full  | `apple-touch-icon`; iOS masks the corners itself and renders transparency as black |
 * | `maskable`   | edge to edge       | 76%   | the manifest's `maskable` icons, which Android crops to an arbitrary shape |
 */
export const APP_ICON_VARIANTS = ['rounded', 'fullBleed', 'maskable'];

/** Every shape in the icon, back to front. */
export function buildAppIconShapes(variant = 'rounded') {
  if (!APP_ICON_VARIANTS.includes(variant)) {
    throw new Error(`Unknown app icon variant '${String(variant)}'.`);
  }

  const hasTransparentCorners = variant === 'rounded';
  const markScale = variant === 'maskable' ? MASKABLE_MARK_SCALE : 1;

  // 150deg and elevated-to-deep is exactly what GradientSurface paints, so the icon
  // is made of the same material as every panel behind it.
  const backgroundFill = linearGradientFillAtCssAngle({
    cssAngleDegrees: 150,
    extent: 0.5,
    startColor: parseHexColor(APP_ICON_PALETTE.backgroundElevated),
    endColor: parseHexColor(APP_ICON_PALETTE.backgroundDeep),
  });

  // 135deg is the brand gradient's angle everywhere else in the app. The extent is
  // measured across the ring rather than across the canvas, so both ends of the
  // gradient land on the mark instead of one of them running off the edge.
  const markFill = linearGradientFillAtCssAngle({
    cssAngleDegrees: 135,
    extent: (RING_RADIUS + RING_HALF_WIDTH) * markScale,
    startColor: parseHexColor(APP_ICON_PALETTE.brandGradientStart),
    endColor: parseHexColor(APP_ICON_PALETTE.brandGradientEnd),
  });

  const background = hasTransparentCorners
    ? superellipseShape({
        centerX: 0.5,
        centerY: 0.5,
        radius: 0.5,
        exponent: 4,
        fill: backgroundFill,
      })
    : fullSquareShape(backgroundFill);

  const ring = arcShape({
    centerX: 0.5,
    centerY: 0.5,
    radius: RING_RADIUS * markScale,
    halfWidth: RING_HALF_WIDTH * markScale,
    startTurns: RING_START_TURNS,
    sweepTurns: RING_SWEEP_TURNS,
    fill: markFill,
  });

  const chevronFill = solidFill(parseHexColor(APP_ICON_PALETTE.textPrimary));
  const chevronApexY = scaleAboutCentre(CHEVRON_APEX_Y, markScale);
  const chevronFootY = scaleAboutCentre(CHEVRON_FOOT_Y, markScale);
  const chevronHalfSpan = CHEVRON_HALF_SPAN * markScale;
  const chevronHalfWidth = CHEVRON_HALF_WIDTH * markScale;

  const chevronLeftArm = capsuleShape({
    fromX: 0.5 - chevronHalfSpan,
    fromY: chevronFootY,
    toX: 0.5,
    toY: chevronApexY,
    halfWidth: chevronHalfWidth,
    fill: chevronFill,
  });

  const chevronRightArm = capsuleShape({
    fromX: 0.5,
    fromY: chevronApexY,
    toX: 0.5 + chevronHalfSpan,
    toY: chevronFootY,
    halfWidth: chevronHalfWidth,
    fill: chevronFill,
  });

  return [background, ring, chevronLeftArm, chevronRightArm];
}

/**
 * The numbers the shapes are built from, so the safe-zone test can assert
 * against them rather than re-deriving them.
 */
export const appIconGeometry = {
  RING_RADIUS,
  RING_HALF_WIDTH,
  MASKABLE_MARK_SCALE,
};
