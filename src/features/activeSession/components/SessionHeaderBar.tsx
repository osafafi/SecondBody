import { X } from 'lucide-react';

import { formatDurationAsMinutesAndSeconds } from '@/domain/restTimer';
import { useCurrentTime } from '@/hooks/useCurrentTime';

import styles from './SessionHeaderBar.module.css';

export type SessionHeaderBarProps = {
  sessionDisplayName: string;

  /** e.g. "Week 3 · Groove the patterns". */
  positionLabel: string;

  loggedSetCount: number;
  plannedSetCount: number;

  sessionStartedAt: Date;

  onLeavePressed: () => void;
};

/**
 * Ticks once a second, and is the only thing on the screen that does.
 *
 * Kept as its own component so a re-render of the clock does not re-render the
 * exercise, the cues and the animation underneath it.
 */
function ElapsedSessionTime({ sessionStartedAt }: { sessionStartedAt: Date }) {
  const now = useCurrentTime();
  const elapsedSeconds = Math.max(0, (now.getTime() - sessionStartedAt.getTime()) / 1000);

  return (
    <span className={styles.elapsed}>{formatDurationAsMinutesAndSeconds(elapsedSeconds)}</span>
  );
}

/**
 * The strip along the top of the session: where he is, how far through, and the
 * one way out.
 *
 * The leave button is deliberately small and to one side. It is not a thing to
 * hit by accident mid-set, which is the same reason the whole screen sits
 * outside the app shell with no bottom navigation under it.
 */
export function SessionHeaderBar({
  sessionDisplayName,
  positionLabel,
  loggedSetCount,
  plannedSetCount,
  sessionStartedAt,
  onLeavePressed,
}: SessionHeaderBarProps) {
  const completedFraction =
    plannedSetCount === 0 ? 0 : Math.min(1, loggedSetCount / plannedSetCount);

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{sessionDisplayName}</h1>
          <p className={styles.position}>{positionLabel}</p>
        </div>

        <div className={styles.trailingGroup}>
          <ElapsedSessionTime sessionStartedAt={sessionStartedAt} />

          <button
            type="button"
            className={styles.leaveButton}
            onClick={onLeavePressed}
            aria-label="Leave this session"
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={plannedSetCount}
        aria-valuenow={loggedSetCount}
        aria-label={`${String(loggedSetCount)} of ${String(plannedSetCount)} sets logged`}
      >
        <span
          className={styles.progressFill}
          style={{ width: `${String(Math.round(completedFraction * 100))}%` }}
        />
      </div>
    </header>
  );
}
