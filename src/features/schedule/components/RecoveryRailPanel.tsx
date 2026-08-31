import { Hourglass, ShieldCheck } from 'lucide-react';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import type { DailyTrainingStatus } from '@/domain/dailyTrainingStatus';

import { formatDateAndTime, formatShortDate } from '../scheduleWording';
import styles from './RecoveryRailPanel.module.css';

export type RecoveryRailPanelProps = {
  trainingStatus: DailyTrainingStatus;

  /** How many hours the programme keeps between sessions. Normally 48. */
  minimumHoursBetweenSessions: number;
};

/**
 * The 48-hour rail, said out loud.
 *
 * The first safety rail in docs/TRAINING_PROGRAM.md section 12 is "never
 * schedule two strength sessions less than 48 hours apart". Every other screen
 * enforces it silently — the start button is simply not there. This is the one
 * place it is explained, because a rule that only ever shows up as a missing
 * button is a rule that gets read as a bug.
 *
 * It is deliberately shown whether or not the rail is currently holding
 * anything back. "You are clear" is as much a fact as "eleven hours to go", and
 * a panel that appeared only when something was blocked would make the rail feel
 * like a punishment.
 */
export function RecoveryRailPanel({
  trainingStatus,
  minimumHoursBetweenSessions,
}: RecoveryRailPanelProps) {
  const isClear = trainingStatus.isAllowedToStartNow;

  return (
    <GradientSurface as="section" variant="elevated" radius="large" className={styles.panel}>
      <div className={styles.headingRow}>
        <IconBadge
          icon={
            isClear ? (
              <ShieldCheck size={20} strokeWidth={1.75} />
            ) : (
              <Hourglass size={20} strokeWidth={1.75} />
            )
          }
          tone={isClear ? 'success' : 'warning'}
          size="medium"
        />

        <div className={styles.headingText}>
          <p className={styles.label}>Recovery</p>
          <h2 className={styles.heading}>
            {isClear ? 'Clear to train' : 'Inside the recovery window'}
          </h2>
        </div>
      </div>

      {/*
       * Factual, not encouraging. The screen states the rule and when it lifts;
       * anything said about it in Harout's voice belongs in
       * `src/content/coachVoice/` and is shown on the Today screen instead.
       */}
      <p className={styles.explanation}>
        The programme keeps {minimumHoursBetweenSessions} hours between strength sessions. The clock
        starts at the end of the last one, because that is when recovery starts.
      </p>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>Last session</dt>
          <dd className={styles.factValue}>{describeLastSession(trainingStatus)}</dd>
        </div>

        <div className={styles.fact}>
          <dt className={styles.factLabel}>Next allowed</dt>
          <dd className={styles.factValue}>
            {trainingStatus.earliestNextSessionAt
              ? formatDateAndTime(trainingStatus.earliestNextSessionAt)
              : 'Now'}
          </dd>
        </div>

        <div className={styles.fact}>
          <dt className={styles.factLabel}>Next scheduled day</dt>
          <dd className={styles.factValue}>
            {trainingStatus.nextAvailableTrainingDate
              ? formatShortDate(trainingStatus.nextAvailableTrainingDate)
              : 'No training days set'}
          </dd>
        </div>
      </dl>
    </GradientSurface>
  );
}

/** "3 days ago", or the honest answer before there has ever been one. */
function describeLastSession(trainingStatus: DailyTrainingStatus): string {
  const { daysSinceLastSession } = trainingStatus;

  if (daysSinceLastSession === null) {
    return 'None yet';
  }

  if (daysSinceLastSession === 0) {
    return 'Today';
  }

  return daysSinceLastSession === 1 ? 'Yesterday' : `${String(daysSinceLastSession)} days ago`;
}
