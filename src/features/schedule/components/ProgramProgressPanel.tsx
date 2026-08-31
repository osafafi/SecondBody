import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import type { ProgramProgressSummary } from '@/domain/programProgressSummary';
import type { ProgramPhase } from '@/types/programTypes';

import { describeSessionsCompleted } from '../scheduleWording';
import styles from './ProgramProgressPanel.module.css';

export type ProgramProgressPanelProps = {
  progressSummary: ProgramProgressSummary;

  /** The programme's phases, in order, for the block underneath the bar. */
  phases: ProgramPhase[];
};

/**
 * Where the twelve weeks have got to.
 *
 * **The bar measures sessions finished, not weeks elapsed.** A week goes by
 * whether or not anything was trained in it, so a bar driven by the calendar
 * would fill up on its own during a fortnight off — which is the opposite of
 * what a progress bar is for. The week number is shown beside it as the separate
 * fact it is.
 */
export function ProgramProgressPanel({ progressSummary, phases }: ProgramProgressPanelProps) {
  const completedPercentage = Math.round(progressSummary.completedFraction * 100);

  return (
    <GradientSurface as="section" variant="elevated" radius="large" className={styles.panel}>
      <div className={styles.headingRow}>
        <div className={styles.headingText}>
          <p className={styles.label}>Programme</p>
          <h2 className={styles.heading}>
            Week {progressSummary.currentWeekNumber} of {progressSummary.totalWeekCount}
          </h2>
        </div>

        <span className={styles.sessionCount}>
          {describeSessionsCompleted(
            progressSummary.completedSessionCount,
            progressSummary.totalSessionCount,
          )}
        </span>
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progressSummary.totalSessionCount}
        aria-valuenow={progressSummary.completedSessionCount}
        aria-valuetext={describeSessionsCompleted(
          progressSummary.completedSessionCount,
          progressSummary.totalSessionCount,
        )}
      >
        <span
          className={styles.progressFill}
          style={{ width: `${String(completedPercentage)}%` }}
        />
      </div>

      <ol className={styles.phases}>
        {phases.map((phase) => {
          const isCurrentPhase = phase.phaseNumber === progressSummary.currentPhaseNumber;

          return (
            <li
              key={phase.phaseNumber}
              className={`${styles.phase ?? ''} ${isCurrentPhase ? (styles.isCurrentPhase ?? '') : ''}`}
              aria-current={isCurrentPhase ? 'step' : undefined}
            >
              <span className={styles.phaseName}>{phase.displayName}</span>
              <span className={styles.phaseWeeks}>
                {describePhaseWeekRange(phase)}
                {isCurrentPhase
                  ? ` · week ${progressSummary.weekNumberWithinPhase} of ${progressSummary.weekCountInPhase}`
                  : ''}
              </span>
            </li>
          );
        })}
      </ol>

      {progressSummary.weekNote ? (
        <p className={styles.weekNote}>{progressSummary.weekNote}</p>
      ) : null}
    </GradientSurface>
  );
}

/** "Weeks 5-8", read off the phase's own weeks rather than assumed. */
function describePhaseWeekRange(phase: ProgramPhase): string {
  const weekNumbers = phase.weeks.map((week) => week.weekNumber);

  if (weekNumbers.length === 0) {
    return '';
  }

  return `Weeks ${String(Math.min(...weekNumbers))}–${String(Math.max(...weekNumbers))}`;
}
