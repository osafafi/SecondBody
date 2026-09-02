import { useEffect, useRef } from 'react';
import { ChevronRight, Eye, LayoutGrid, Plus, Timer } from 'lucide-react';

import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { findExerciseById } from '@/content/exercises/allExercises';
import { formatDurationAsMinutesAndSeconds, readRestTimer } from '@/domain/restTimer';
import type { PlannedExercise } from '@/domain/sessionPlanning';
import { useCurrentTime } from '@/hooks/useCurrentTime';

import { describePrescriptionHeadline, describeSetTarget } from '../prescriptionWording';
import { playRestFinishedChime } from '../restTimerChime';
import styles from './RestTimerPanel.module.css';

export type RestTimerPanelProps = {
  restStartedAt: Date;
  restTargetSeconds: number;

  /** What the rest ends at. Null only if the plan lost it, which it should not. */
  nextExercise: PlannedExercise | null;

  /** False when the rest ends at another set of the movement just performed. */
  isNextExerciseANewOne: boolean;

  /** 1-based, and only meaningful when the rest leads back into the same movement. */
  nextSetNumber: number;

  coachLine: string | null;

  shouldPlaySound: boolean;

  onRestExtended: (extraSeconds: number) => void;
  onRestFinished: () => void;
  onNextExercisePreviewed: () => void;
  onSessionBoardOpened: () => void;
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
 *
 * **What is coming next is shown, not named.** F7: "the waiting page seems
 * pretty restrictive". A rest is a minute and a half of standing still, and it
 * used to spend them on a countdown and one line of gym English. Now the next
 * movement is on the screen with its animation and its numbers, and the two
 * quiet buttons underneath open it in full or open the whole session — which is
 * exactly the reading anyone would want to be doing during a rest.
 */
export function RestTimerPanel({
  restStartedAt,
  restTargetSeconds,
  nextExercise,
  isNextExerciseANewOne,
  nextSetNumber,
  coachLine,
  shouldPlaySound,
  onRestExtended,
  onRestFinished,
  onNextExercisePreviewed,
  onSessionBoardOpened,
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

  const nextExerciseDefinition = nextExercise ? findExerciseById(nextExercise.exerciseId) : null;
  const nextExerciseName =
    nextExerciseDefinition?.displayName ?? nextExercise?.exerciseId ?? 'The last of it';
  const nextHeadline = nextExercise ? describePrescriptionHeadline(nextExercise) : null;

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

      {nextExercise ? (
        <GradientSurface variant="elevated" radius="large" className={styles.nextUp}>
          <p className={styles.nextUpLabel}>
            {isNextExerciseANewOne ? 'Next up' : `Next up · set ${String(nextSetNumber)}`}
          </p>

          <div className={styles.nextUpBody}>
            <ExerciseAnimation
              exerciseId={nextExercise.exerciseId}
              displayName={nextExerciseName}
              primaryMuscleGroups={nextExerciseDefinition?.primaryMuscleGroups ?? []}
              className={styles.nextUpAnimation ?? ''}
            />

            <div className={styles.nextUpText}>
              <p className={styles.nextUpName}>{nextExerciseName}</p>

              {nextHeadline ? (
                <p className={styles.nextUpPrescription}>
                  <span className={styles.nextUpWeight}>{nextHeadline.value}</span>
                  {nextHeadline.unit ? ` ${nextHeadline.unit}` : ''}
                  {' · '}
                  {describeSetTarget(nextExercise)}
                </p>
              ) : null}

              {nextExerciseDefinition ? (
                <p className={styles.nextUpCue}>{nextExerciseDefinition.formCues[0]}</p>
              ) : null}
            </div>
          </div>

          <div className={styles.nextUpActions}>
            <GradientButton
              tone="ghost"
              onClick={onNextExercisePreviewed}
              leadingIcon={<Eye size={16} strokeWidth={2} aria-hidden />}
            >
              Look at it properly
            </GradientButton>

            <GradientButton
              tone="ghost"
              onClick={onSessionBoardOpened}
              leadingIcon={<LayoutGrid size={16} strokeWidth={2} aria-hidden />}
            >
              All exercises
            </GradientButton>
          </div>
        </GradientSurface>
      ) : null}

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
