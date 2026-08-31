import styles from './TrendLineChart.module.css';

/**
 * One point on the line.
 *
 * `markerValue` is the raw observation behind the smoothed `value`. It is drawn
 * as a faint dot rather than a second line, which is the whole visual argument
 * of the body weight panel: the average is the story, the readings are evidence.
 */
export type TrendLineChartPoint = {
  /** Read out by screen readers and used for the first and last axis labels. */
  label: string;

  value: number;

  markerValue?: number | null | undefined;
};

/** A shaded horizontal band, in the same units as the values. */
export type TrendLineChartBand = {
  lowest: number;
  highest: number;
  label: string;
};

export type TrendLineChartProps = {
  /** Oldest first. Fewer than two points draws nothing. */
  points: readonly TrendLineChartPoint[];

  /** What the chart is, as a sentence. It is a picture to everything else. */
  ariaLabel: string;

  band?: TrendLineChartBand | undefined;

  formatValue: (value: number) => string;
};

/*
 * A fixed viewBox with `height: auto`, so the SVG scales uniformly and a dot
 * stays a circle. Stretching to fill with `preserveAspectRatio="none"` would be
 * easier and would draw ellipses.
 */
const VIEW_BOX_WIDTH = 320;
const VIEW_BOX_HEIGHT = 132;
const VERTICAL_PADDING = 12;

/** Keeps a flat line off the floor of the chart rather than on it. */
const MINIMUM_VALUE_SPREAD = 1;

type ValueScale = {
  lowestValue: number;
  highestValue: number;
};

function resolveValueScale(
  points: readonly TrendLineChartPoint[],
  band: TrendLineChartBand | undefined,
): ValueScale {
  const values = points.flatMap((point) => [
    point.value,
    ...(typeof point.markerValue === 'number' ? [point.markerValue] : []),
  ]);

  if (band) {
    values.push(band.lowest, band.highest);
  }

  const lowestValue = Math.min(...values);
  const highestValue = Math.max(...values);

  if (highestValue - lowestValue >= MINIMUM_VALUE_SPREAD) {
    return { lowestValue, highestValue };
  }

  const midpoint = (highestValue + lowestValue) / 2;

  return {
    lowestValue: midpoint - MINIMUM_VALUE_SPREAD / 2,
    highestValue: midpoint + MINIMUM_VALUE_SPREAD / 2,
  };
}

function projectHorizontally(pointIndex: number, pointCount: number): number {
  if (pointCount <= 1) {
    return VIEW_BOX_WIDTH / 2;
  }

  return (pointIndex / (pointCount - 1)) * VIEW_BOX_WIDTH;
}

function projectVertically(value: number, scale: ValueScale): number {
  const drawableHeight = VIEW_BOX_HEIGHT - VERTICAL_PADDING * 2;
  const positionInScale = (value - scale.lowestValue) / (scale.highestValue - scale.lowestValue);

  // SVG y grows downwards, and a heavier weight belongs higher up the chart.
  return VERTICAL_PADDING + (1 - positionInScale) * drawableHeight;
}

/**
 * A single smoothed line, optionally over a shaded band, with the raw readings
 * as dots behind it.
 *
 * Feature-agnostic on purpose: it knows about numbers and labels, never about
 * kilograms or weeks. The body weight panel supplies the meaning.
 */
export function TrendLineChart({ points, ariaLabel, band, formatValue }: TrendLineChartProps) {
  if (points.length === 0) {
    return null;
  }

  const scale = resolveValueScale(points, band);

  const linePath = points
    .map((point, pointIndex) => {
      const horizontal = projectHorizontally(pointIndex, points.length);
      const vertical = projectVertically(point.value, scale);

      return `${pointIndex === 0 ? 'M' : 'L'}${horizontal.toFixed(2)} ${vertical.toFixed(2)}`;
    })
    .join(' ');

  const bandTop = band ? projectVertically(band.highest, scale) : 0;
  const bandBottom = band ? projectVertically(band.lowest, scale) : 0;

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <figure className={styles.chart}>
      <svg
        className={styles.canvas}
        viewBox={`0 0 ${String(VIEW_BOX_WIDTH)} ${String(VIEW_BOX_HEIGHT)}`}
        role="img"
        aria-label={ariaLabel}
      >
        {band ? (
          <rect
            className={styles.band}
            x={0}
            y={Math.min(bandTop, bandBottom)}
            width={VIEW_BOX_WIDTH}
            height={Math.max(Math.abs(bandBottom - bandTop), 1)}
          />
        ) : null}

        {points.map((point, pointIndex) =>
          typeof point.markerValue === 'number' ? (
            <circle
              key={`${point.label}-marker`}
              className={styles.marker}
              cx={projectHorizontally(pointIndex, points.length)}
              cy={projectVertically(point.markerValue, scale)}
              r={2.5}
            />
          ) : null,
        )}

        <path className={styles.line} d={linePath} />

        {lastPoint ? (
          <circle
            className={styles.latestPoint}
            cx={projectHorizontally(points.length - 1, points.length)}
            cy={projectVertically(lastPoint.value, scale)}
            r={4}
          />
        ) : null}
      </svg>

      <figcaption className={styles.axis}>
        <span>{firstPoint?.label}</span>
        {band ? <span className={styles.bandLabel}>{band.label}</span> : null}
        <span>{lastPoint ? formatValue(lastPoint.value) : null}</span>
      </figcaption>
    </figure>
  );
}
