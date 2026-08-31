import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import type { UpcomingTrainingDay } from '@/domain/trainingCalendar';

import { describeDaysAway, formatShortDate } from '../scheduleWording';
import styles from './UpcomingSessionsList.module.css';

export type UpcomingSessionRow = UpcomingTrainingDay & {
  /** From the programme content, e.g. "Push & Hinge". */
  sessionDisplayName: string;
};

export type UpcomingSessionsListProps = {
  upcomingSessions: UpcomingSessionRow[];
  now: Date;
};

/**
 * The next few training days, with what each one is.
 *
 * The letters here are a projection rather than a promise — they come from
 * `buildTrainingCalendar`, which cycles A, B, C forward through the planned
 * days. Miss one and everything after it shifts back by a day rather than being
 * skipped, which is what makes the cycle worth projecting rather than reading
 * off the weekday.
 */
export function UpcomingSessionsList({ upcomingSessions, now }: UpcomingSessionsListProps) {
  if (upcomingSessions.length === 0) {
    return null;
  }

  return (
    <GradientSurface as="section" variant="elevated" radius="large" className={styles.panel}>
      <h2 className={styles.heading}>Coming up</h2>

      <ol className={styles.rows}>
        {upcomingSessions.map((upcomingSession) => (
          <li key={upcomingSession.date.toISOString()} className={styles.row}>
            <span className={styles.letter} aria-hidden>
              {upcomingSession.sessionLetter}
            </span>

            <span className={styles.rowText}>
              <span className={styles.sessionName}>
                Session {upcomingSession.sessionLetter} · {upcomingSession.sessionDisplayName}
              </span>
              <span className={styles.rowDate}>
                {formatShortDate(upcomingSession.date)} ·{' '}
                {describeDaysAway(upcomingSession.date, now)}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </GradientSurface>
  );
}
