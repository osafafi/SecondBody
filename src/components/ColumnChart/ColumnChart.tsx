import styles from './ColumnChart.module.css';

export type ColumnChartColumn = {
  /** The short label under the column. Keep it to a few characters. */
  label: string;

  /** Spoken instead of the label, where the label is an abbreviation. */
  accessibleLabel: string;

  value: number;

  /** Draws the column in the brand gradient rather than the muted fill. */
  isHighlighted?: boolean;
};

export type ColumnChartProps = {
  /** Oldest first. Columns with a value of zero are drawn as an empty slot. */
  columns: readonly ColumnChartColumn[];

  ariaLabel: string;

  formatValue: (value: number) => string;
};

/** Enough of a stub that an empty week is visibly a week rather than a gap. */
const EMPTY_COLUMN_HEIGHT_PERCENT = 2;

/**
 * A row of columns, sized against the largest one.
 *
 * Built from elements rather than SVG because it has to reflow: twelve weeks on
 * a phone in portrait is a different width to twelve weeks on the same phone
 * turned sideways, and flexbox already solves that.
 *
 * Feature-agnostic — it knows nothing about volume, weeks or kilograms.
 */
export function ColumnChart({ columns, ariaLabel, formatValue }: ColumnChartProps) {
  if (columns.length === 0) {
    return null;
  }

  const largestValue = Math.max(...columns.map((column) => column.value));

  return (
    <figure className={styles.chart} role="img" aria-label={ariaLabel}>
      <div className={styles.columns}>
        {columns.map((column) => {
          const heightPercent =
            largestValue > 0 && column.value > 0
              ? Math.max((column.value / largestValue) * 100, EMPTY_COLUMN_HEIGHT_PERCENT)
              : EMPTY_COLUMN_HEIGHT_PERCENT;

          return (
            <div className={styles.column} key={column.accessibleLabel}>
              <div className={styles.track}>
                <div
                  className={[styles.fill, column.isHighlighted ? styles.isHighlighted : null]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ height: `${String(heightPercent)}%` }}
                />
              </div>

              <span className={styles.label}>{column.label}</span>
            </div>
          );
        })}
      </div>

      {/*
       * The numbers themselves, for anyone who cannot see the columns. Hidden
       * visually rather than omitted, because a picture of a trend with no
       * readable values behind it is not an accessible chart.
       */}
      <figcaption className={styles.visuallyHidden}>
        {columns
          .map((column) => `${column.accessibleLabel}: ${formatValue(column.value)}`)
          .join('. ')}
      </figcaption>
    </figure>
  );
}
