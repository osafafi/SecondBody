/**
 * A very small shape rasteriser, in normalised coordinates.
 *
 * Everything is described in a 0..1 square with the centre at (0.5, 0.5), so one
 * set of numbers renders every size the manifest asks for. Shapes are drawn
 * back to front and composited per sub-sample, then box-filtered down — which is
 * the whole anti-aliasing strategy. It is brute force, and at 512 pixels with a
 * factor of 4 that is 4 million coverage tests, which takes well under a second.
 *
 * Colours are `[red, green, blue, alpha]`, each 0-255.
 */

/** Enough to keep a curved edge smooth at 96 pixels, which is the smallest we emit. */
export const DEFAULT_SUPERSAMPLE_FACTOR = 4;

export function parseHexColor(hexColor, alpha = 255) {
  const normalised = hexColor.replace('#', '');

  return [
    Number.parseInt(normalised.slice(0, 2), 16),
    Number.parseInt(normalised.slice(2, 4), 16),
    Number.parseInt(normalised.slice(4, 6), 16),
    alpha,
  ];
}

/** A single colour everywhere. */
export function solidFill(color) {
  return () => color;
}

/**
 * A straight gradient between two points, clamped outside them.
 *
 * The design system's rule is that no surface is flat (docs/DESIGN_SYSTEM.md),
 * and an icon is a surface.
 */
export function linearGradientFill({ fromX, fromY, toX, toY, startColor, endColor }) {
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  return (x, y) => {
    const projected = ((x - fromX) * deltaX + (y - fromY) * deltaY) / lengthSquared;
    const position = Math.min(1, Math.max(0, projected));

    return [
      startColor[0] + (endColor[0] - startColor[0]) * position,
      startColor[1] + (endColor[1] - startColor[1]) * position,
      startColor[2] + (endColor[2] - startColor[2]) * position,
      startColor[3] + (endColor[3] - startColor[3]) * position,
    ];
  };
}

/**
 * The same gradient, expressed the way the stylesheets express it.
 *
 * CSS measures the angle clockwise from "to top", so `linear-gradient(135deg, ...)`
 * runs to the bottom-right. Saying it that way here means the icon's gradients and
 * the app's gradients can be compared without converting anything: 135 is the brand
 * gradient, 150 is every `GradientSurface`.
 *
 * `extent` is the half-length of the gradient line, out from the centre.
 */
export function linearGradientFillAtCssAngle({
  cssAngleDegrees,
  extent,
  centerX = 0.5,
  centerY = 0.5,
  startColor,
  endColor,
}) {
  const angleInRadians = (cssAngleDegrees * Math.PI) / 180;
  const directionX = Math.sin(angleInRadians);
  const directionY = -Math.cos(angleInRadians);

  return linearGradientFill({
    fromX: centerX - directionX * extent,
    fromY: centerY - directionY * extent,
    toX: centerX + directionX * extent,
    toY: centerY + directionY * extent,
    startColor,
    endColor,
  });
}

/** The whole canvas. Used as the background of the maskable icons, which bleed to the edge. */
export function fullSquareShape(fill) {
  return { isInside: () => true, fill };
}

/**
 * A superellipse — the rounded square Apple made everyone want.
 *
 * `exponent` 2 is a circle and 100 is a square; 4 is the squircle everything
 * else in this app is cornered with.
 */
export function superellipseShape({ centerX, centerY, radius, exponent, fill }) {
  return {
    isInside: (x, y) =>
      Math.abs((x - centerX) / radius) ** exponent + Math.abs((y - centerY) / radius) ** exponent <=
      1,
    fill,
  };
}

/**
 * A line with rounded ends — the same thing a round-capped SVG stroke draws,
 * which is what lets `svgRenderer.mjs` emit these shapes as one `<path>` each.
 */
export function capsuleShape({ fromX, fromY, toX, toY, halfWidth, fill }) {
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const halfWidthSquared = halfWidth * halfWidth;

  return {
    isInside: (x, y) => {
      const projected =
        lengthSquared === 0
          ? 0
          : Math.min(1, Math.max(0, ((x - fromX) * deltaX + (y - fromY) * deltaY) / lengthSquared));

      const nearestX = fromX + projected * deltaX;
      const nearestY = fromY + projected * deltaY;
      const offsetX = x - nearestX;
      const offsetY = y - nearestY;

      return offsetX * offsetX + offsetY * offsetY <= halfWidthSquared;
    },
    fill,
  };
}

/**
 * An arc of a thick ring, with rounded ends.
 *
 * Angles are in turns, clockwise, with 0 at twelve o'clock — the way the rest
 * timer's progress ring is read, because that is what this shape is.
 */
export function arcShape({ centerX, centerY, radius, halfWidth, startTurns, sweepTurns, fill }) {
  const halfWidthSquared = halfWidth * halfWidth;

  const angleOf = (turns) => turns * Math.PI * 2;
  const pointAt = (turns) => [
    centerX + radius * Math.sin(angleOf(turns)),
    centerY - radius * Math.cos(angleOf(turns)),
  ];

  const [startCapX, startCapY] = pointAt(startTurns);
  const [endCapX, endCapY] = pointAt(startTurns + sweepTurns);

  const isWithinCap = (x, y, capX, capY) => {
    const offsetX = x - capX;
    const offsetY = y - capY;

    return offsetX * offsetX + offsetY * offsetY <= halfWidthSquared;
  };

  return {
    isInside: (x, y) => {
      const offsetX = x - centerX;
      const offsetY = y - centerY;
      const distanceFromCentre = Math.hypot(offsetX, offsetY);

      if (Math.abs(distanceFromCentre - radius) <= halfWidth) {
        // atan2 with the arguments this way round measures clockwise from twelve.
        const turns = Math.atan2(offsetX, -offsetY) / (Math.PI * 2);
        const turnsFromStart = (((turns - startTurns) % 1) + 1) % 1;

        if (turnsFromStart <= sweepTurns) {
          return true;
        }
      }

      return isWithinCap(x, y, startCapX, startCapY) || isWithinCap(x, y, endCapX, endCapY);
    },
    fill,
  };
}

function compositeOver(sourceColor, accumulated) {
  const sourceAlpha = sourceColor[3] / 255;

  accumulated[0] = sourceColor[0] * sourceAlpha + accumulated[0] * (1 - sourceAlpha);
  accumulated[1] = sourceColor[1] * sourceAlpha + accumulated[1] * (1 - sourceAlpha);
  accumulated[2] = sourceColor[2] * sourceAlpha + accumulated[2] * (1 - sourceAlpha);
  accumulated[3] = sourceColor[3] + accumulated[3] * (1 - sourceAlpha);
}

/** Renders shapes, back to front, into a tightly packed RGBA buffer. */
export function rasteriseShapes(
  shapes,
  sizeInPixels,
  supersampleFactor = DEFAULT_SUPERSAMPLE_FACTOR,
) {
  const rgbaPixels = Buffer.alloc(sizeInPixels * sizeInPixels * 4);
  const subSamplesPerPixel = supersampleFactor * supersampleFactor;
  const subSampleColor = [0, 0, 0, 0];

  for (let pixelY = 0; pixelY < sizeInPixels; pixelY += 1) {
    for (let pixelX = 0; pixelX < sizeInPixels; pixelX += 1) {
      let totalRed = 0;
      let totalGreen = 0;
      let totalBlue = 0;
      let totalAlpha = 0;

      for (let subY = 0; subY < supersampleFactor; subY += 1) {
        for (let subX = 0; subX < supersampleFactor; subX += 1) {
          const x = (pixelX + (subX + 0.5) / supersampleFactor) / sizeInPixels;
          const y = (pixelY + (subY + 0.5) / supersampleFactor) / sizeInPixels;

          subSampleColor[0] = 0;
          subSampleColor[1] = 0;
          subSampleColor[2] = 0;
          subSampleColor[3] = 0;

          for (const shape of shapes) {
            if (shape.isInside(x, y)) {
              compositeOver(shape.fill(x, y), subSampleColor);
            }
          }

          totalRed += subSampleColor[0];
          totalGreen += subSampleColor[1];
          totalBlue += subSampleColor[2];
          totalAlpha += subSampleColor[3];
        }
      }

      const destinationOffset = (pixelY * sizeInPixels + pixelX) * 4;

      rgbaPixels[destinationOffset] = Math.round(totalRed / subSamplesPerPixel);
      rgbaPixels[destinationOffset + 1] = Math.round(totalGreen / subSamplesPerPixel);
      rgbaPixels[destinationOffset + 2] = Math.round(totalBlue / subSamplesPerPixel);
      rgbaPixels[destinationOffset + 3] = Math.round(totalAlpha / subSamplesPerPixel);
    }
  }

  return rgbaPixels;
}
