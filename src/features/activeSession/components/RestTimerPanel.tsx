import { useEffect, useRef } from 'react';
import { ChevronRight, Plus, Timer } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { formatDurationAsMinutesAndSeconds, readRestTimer } from '@/domain/restTimer';
import { useCurrentTime } from '@/hooks/useCurrentTime';

import { playRestFinishedChime } from '../restTimerChime';
import styles from './RestTimerPanel.module.css';

export type RestTimerPanelProps = {
  restStartedAt: Date;
  restTargetSeconds: number;

  /** What is coming after the rest, so it is worth staying on the screen for. */
  nextUpLabel: string;

  coachLine: string | null;

  shouldPlaySound: boolean;

  onRestExtended: (extraSeconds: number) => void;
  onRestFinished: () => void;
};

/** One tap adds half a minute, which is what a hard set actually needs. */
const REST_EXTENSION_SECONDS = 30;

/** The ring is drawn as an SVG circle, so this is its geometry. */
const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * The rest between two sets.
 *
 * Mounted only while resting, which is what makes the first frame correct:
 * `useCurrentTime` reads the clock as it mounts rather than an effect later.
 *
 * The timer does not advance the session by itself. Ninety seconds is a
 * prescription rather than a starting pistol, and being dragged into the next
 * set by a countdown is a worse experience than tapping a button — so it goes on
 * counting, shows the overrun, and waits.
 */
export function RestTimerPanel({
  restStartedAt,
  restTargetSeconds,
  nextUpLabel,
  coachLine,
  shouldPlaySound,
  onRestExtended,
  onRestFinished,
}: RestTimerPanelProps) {
  const now = useCurrentTime();
  const reading = readRestTimer(restStartedAt, restTargetSeconds, now);

  const hasPlayedChime = useRef(false);

  useEffect(() => {
    if (!shouldPlaySound || hasPlayedChime.current || !reading.hasReachedTarget) {
      return;
    }

    hasPlayedChime.current = true;
    playRestFinishedChime();
  }, [shouldPlaySound, reading.hasReachedTarget]);

  return (
    <div className={styles.panel}>
      <GradientSurface variant="glass" radius="xlarge" className={styles.timerSurface}>
        <div className={styles.ring}>
          <svg viewBox="0 0 128 128" className={styles.ringSvg} aria-hidden>
            <circle className={styles.ringTrack} cx="64" cy="64" r={RING_RADIUS} />
            <circle
              className={styles.ringFill}
              cx="64"
              cy="64"
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - reading.completedFraction)}
            />
          </svg>

          <div className={styles.ringCentre}>
            <span className={styles.remaining} aria-live="off">
              {reading.hasReachedTarget
                ? formatDurationAsMinutesAndSeconds(reading.overrunSeconds)
                : formatDurationAsMinutesAndSeconds(reading.remainingSeconds)}
            </span>
            <span className={styles.remainingLabel}>
              {reading.hasReachedTarget ? 'over' : 'rest left'}
            </span>
          </div>
        </div>

        <p className={styles.target}>
          <Timer size={14} strokeWidth={2} aria-hidden />
          {formatDurationAsMinutesAndSeconds(restTargetSeconds)} prescribed
        </p>

        {coachLine ? <p className={styles.coachLine}>{coachLine}</p> : null}
      </GradientSurface>

      <GradientSurface variant="outlined" radius="large" className={styles.nextUp}>
        <p className={styles.nextUpLabel}>Next up</p>
        <p className={styles.nextUpValue}>{nextUpLabel}</p>
      </GradientSurface>

      <div className={styles.actions}>
        <GradientButton
          tone={reading.hasReachedTarget ? 'primary' : 'secondary'}
          size="large"
          isFullWidth
          onClick={onRestFinished}
          trailingIcon={<ChevronRight size={18} strokeWidth={2.5} aria-hidden />}
        >
          {reading.hasReachedTarget ? 'Ready' : 'Skip the rest'}
        </GradientButton>

        <GradientButton
          tone="ghost"
          isFullWidth
          onClick={() => {
            onRestExtended(REST_EXTENSION_SECONDS);
          }}
          leadingIcon={<Plus size={16} strokeWidth={2} aria-hidden />}
        >
          Another {String(REST_EXTENSION_SECONDS)} seconds
        </GradientButton>
      </div>
    </div>
  );
}
