import { Scale } from 'lucide-react';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { TrendLineChart } from '@/components/TrendLineChart/TrendLineChart';
import type { BodyWeightTrendSummary } from '@/domain/bodyWeightTrend';

import {
  describeBodyWeightTrend,
  formatShortDate,
  formatWeightKilograms,
  describeWeightChange,
} from '../progressWording';
import styles from './BodyWeightTrendPanel.module.css';

export type BodyWeightTrendPanelProps = {
  trendSummary: BodyWeightTrendSummary;

  /** Harout's line about the first three weeks, when it applies. */
  earlyScaleCoachLine: string | null;
};

/**
 * The scale, led by the seven-day average.
 *
 * The design constraint from the feature README, and the reason the raw reading
 * is a faint dot rather than the headline: a raw daily line is what makes people
 * panic on a water-weight day and quit in week three.
 *
 * The expected band is drawn behind the line rather than described beside it,
 * so "am I where I should be" is answered by looking rather than by reading.
 */
export function BodyWeightTrendPanel({
  trendSummary,
  earlyScaleCoachLine,
}: BodyWeightTrendPanelProps) {
  const hasSomethingToDraw = trendSummary.series.length > 0;

  return (
    <GradientSurface as="section" radius="xlarge" className={styles.panel}>
      <header className={styles.headlineRow}>
        <IconBadge icon={<Scale size={20} strokeWidth={1.75} />} />

        <div className={styles.headlineText}>
          <span className={styles.eyebrow}>Body weight</span>
          <h2 className={styles.title}>
            {trendSummary.latestRollingAverageKilograms === null
              ? 'No weigh-ins yet'
              : formatWeightKilograms(trendSummary.latestRollingAverageKilograms)}
          </h2>
        </div>
      </header>

      {hasSomethingToDraw ? (
        <TrendLineChart
          points={trendSummary.series.map((point) => ({
            label: formatShortDate(point.onDate),
            value: point.rollingAverageKilograms,
            markerValue: point.recordedWeightKilograms,
          }))}
          band={{
            lowest: trendSummary.expectedRange.lightest,
            highest: trendSummary.expectedRange.heaviest,
            label: 'expected range',
          }}
          formatValue={formatWeightKilograms}
          ariaLabel={`Seven day average body weight, ending at ${formatWeightKilograms(
            trendSummary.latestRollingAverageKilograms ?? 0,
          )}.`}
        />
      ) : null}

      <p className={styles.reading}>{describeBodyWeightTrend(trendSummary)}</p>

      {hasSomethingToDraw ? (
        <dl className={styles.statRow}>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>Last reading</dt>
            <dd className={styles.statValue}>
              {trendSummary.latestRecordedWeightKilograms === null
                ? '—'
                : formatWeightKilograms(trendSummary.latestRecordedWeightKilograms)}
            </dd>
          </div>

          <div className={styles.stat}>
            <dt className={styles.statLabel}>Per week</dt>
            <dd className={styles.statValue}>
              {trendSummary.weeklyChangeKilograms === null
                ? '—'
                : describeWeightChange(trendSummary.weeklyChangeKilograms)}
            </dd>
          </div>

          <div className={styles.stat}>
            <dt className={styles.statLabel}>To target</dt>
            <dd className={styles.statValue}>
              {trendSummary.remainingToTargetKilograms === null
                ? '—'
                : formatWeightKilograms(trendSummary.remainingToTargetKilograms)}
            </dd>
          </div>
        </dl>
      ) : null}

      {earlyScaleCoachLine ? <p className={styles.coachLine}>{earlyScaleCoachLine}</p> : null}
    </GradientSurface>
  );
}
