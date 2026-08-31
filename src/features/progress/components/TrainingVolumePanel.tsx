import { BarChart3 } from 'lucide-react';

import { ColumnChart } from '@/components/ColumnChart/ColumnChart';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import type { TrainingVolumeComparison, TrainingVolumeWeek } from '@/domain/trainingVolumeTrend';

import {
  describeVolumeComparison,
  formatShortDate,
  formatVolumeKilograms,
  formatWeekColumnLabel,
} from '../progressWording';
import styles from './TrainingVolumePanel.module.css';

export type TrainingVolumePanelProps = {
  /** Oldest first, one per week, including the empty ones. */
  weeks: readonly TrainingVolumeWeek[];

  comparison: TrainingVolumeComparison | null;

  heaviestWeek: TrainingVolumeWeek | null;

  totalVolumeKilograms: number;
};

/**
 * Work done, by week.
 *
 * Weeks rather than sessions, because a week is a full rotation of A, B and C
 * and two sessions of different letters are not comparable with each other. The
 * empty bars are the point as much as the full ones — see
 * `trainingVolumeTrend.ts`.
 */
export function TrainingVolumePanel({
  weeks,
  comparison,
  heaviestWeek,
  totalVolumeKilograms,
}: TrainingVolumePanelProps) {
  const comparisonDescription = describeVolumeComparison(comparison);
  const hasAnyVolume = totalVolumeKilograms > 0;

  return (
    <GradientSurface as="section" radius="xlarge" className={styles.panel}>
      <header className={styles.headlineRow}>
        <IconBadge icon={<BarChart3 size={20} strokeWidth={1.75} />} />

        <div className={styles.headlineText}>
          <span className={styles.eyebrow}>Training volume · {String(weeks.length)} weeks</span>
          <h2 className={styles.title}>{formatVolumeKilograms(totalVolumeKilograms)}</h2>
        </div>
      </header>

      {hasAnyVolume ? (
        <>
          <ColumnChart
            columns={weeks.map((week, weekIndex) => ({
              label: formatWeekColumnLabel(
                week.weekStartOn,
                weeks[weekIndex - 1]?.weekStartOn ?? null,
              ),
              accessibleLabel: `Week of ${formatShortDate(week.weekStartOn)}`,
              value: week.totalVolumeKilograms,
              isHighlighted: weekIndex === weeks.length - 1,
            }))}
            formatValue={formatVolumeKilograms}
            ariaLabel="Training volume by week, oldest first."
          />

          {comparisonDescription ? <p className={styles.reading}>{comparisonDescription}</p> : null}

          {heaviestWeek ? (
            <p className={styles.footnote}>
              Biggest week so far: {formatVolumeKilograms(heaviestWeek.totalVolumeKilograms)}, week
              of {formatShortDate(heaviestWeek.weekStartOn)}.
            </p>
          ) : null}
        </>
      ) : (
        <p className={styles.reading}>
          Nothing to chart yet. Finish a session and the first bar appears here — volume is weight
          times reps, added up, which is the honest answer to whether you are doing more than you
          were.
        </p>
      )}
    </GradientSurface>
  );
}
