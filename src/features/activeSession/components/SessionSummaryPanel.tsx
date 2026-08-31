import { CircleCheckBig, Clock, Dumbbell, Layers } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { formatDurationAsMinutesAndSeconds } from '@/domain/restTimer';
import type { LoggedSessionSummary } from '@/domain/sessionLogging';

import styles from './SessionSummaryPanel.module.css';

export type SessionSummaryPanelProps = {
  summary: LoggedSessionSummary;
  sessionDisplayName: string;
  coachLine: string | null;

  /** Set when a write did not go through. The session is kept either way. */
  saveErrorMessage: string | null;

  onDonePressed: () => void;
};

/**
 * What was just done, once it is saved.
 *
 * Three numbers and a line from Harout. Not a celebration screen — turning up is
 * the expected outcome rather than an achievement, and praise here is rationed
 * by `shouldPraiseSessionCompletion` to roughly one session a fortnight so that
 * when it does arrive it means something.
 */
export function SessionSummaryPanel({
  summary,
  sessionDisplayName,
  coachLine,
  saveErrorMessage,
  onDonePressed,
}: SessionSummaryPanelProps) {
  return (
    <div className={styles.panel}>
      <GradientSurface variant="accent" radius="xlarge" className={styles.hero}>
        <IconBadge icon={<CircleCheckBig size={26} strokeWidth={1.75} />} size="large" isSolid />

        <h2 className={styles.title}>{sessionDisplayName} done</h2>

        {coachLine ? <p className={styles.coachLine}>{coachLine}</p> : null}
      </GradientSurface>

      <div className={styles.statRow}>
        <GradientSurface variant="elevated" radius="large" className={styles.stat}>
          <IconBadge icon={<Layers size={18} strokeWidth={1.75} />} size="small" />
          <span className={styles.statValue}>
            {String(summary.loggedSetCount)}
            <span className={styles.statOutOf}>/{String(summary.plannedSetCount)}</span>
          </span>
          <span className={styles.statLabel}>sets</span>
        </GradientSurface>

        <GradientSurface variant="elevated" radius="large" className={styles.stat}>
          <IconBadge icon={<Dumbbell size={18} strokeWidth={1.75} />} size="small" />
          <span className={styles.statValue}>
            {String(Math.round(summary.totalVolumeKilograms))}
          </span>
          <span className={styles.statLabel}>kg lifted</span>
        </GradientSurface>

        <GradientSurface variant="elevated" radius="large" className={styles.stat}>
          <IconBadge icon={<Clock size={18} strokeWidth={1.75} />} size="small" />
          <span className={styles.statValue}>
            {formatDurationAsMinutesAndSeconds(summary.durationSeconds)}
          </span>
          <span className={styles.statLabel}>minutes</span>
        </GradientSurface>
      </div>

      {summary.skippedExerciseCount > 0 ? (
        <GradientSurface variant="outlined" radius="large" className={styles.footnote}>
          <p>
            {summary.skippedExerciseCount === 1
              ? 'One exercise was skipped. It is recorded as skipped, not as a gap.'
              : `${String(summary.skippedExerciseCount)} exercises were skipped. They are recorded as skipped, not as gaps.`}
          </p>
        </GradientSurface>
      ) : null}

      {summary.didAnySetCauseSharpPain ? (
        <GradientSurface variant="outlined" radius="large" className={styles.footnote}>
          <p>
            Something was flagged for sharp pain. The weight on that movement comes down twenty
            percent next time.
          </p>
        </GradientSurface>
      ) : null}

      {saveErrorMessage ? (
        <GradientSurface variant="outlined" radius="large" className={styles.footnote} role="alert">
          <p>{saveErrorMessage}</p>
        </GradientSurface>
      ) : null}

      <GradientButton tone="primary" size="large" isFullWidth onClick={onDonePressed}>
        Done
      </GradientButton>
    </div>
  );
}
