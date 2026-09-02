import {
  AlertTriangle,
  ChevronRight,
  Hourglass,
  LayoutGrid,
  Lightbulb,
  Replace,
  SkipForward,
  TrendingUp,
} from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { findExerciseById } from '@/content/exercises/allExercises';
import type { PlannedExercise } from '@/domain/sessionPlanning';

import styles from './ExerciseBriefPanel.module.css';
import { ExerciseReferenceContent } from './ExerciseReferenceContent';

export type ExerciseBriefPanelProps = {
  plannedExercise: PlannedExercise;

  /** 1-based, for "3 of 6". */
  exercisePosition: number;
  exerciseCount: number;

  /** How many sets of this exercise are already logged. */
  loggedSetCount: number;

  /** Week 1 has no prescription to trust yet, so it explains itself instead. */
  isCalibrationWeek: boolean;

  /** True when this movement was set aside earlier and has come back around. */
  wasWaitingOnAMachine: boolean;

  loadChangeCoachLine: string | null;
  calibrationCoachLine: string | null;

  onExerciseStarted: () => void;
  onExerciseParked: () => void;
  onExerciseSkipped: () => void;
  onMarkedUnavailable: () => void;
  onSessionBoardOpened: () => void;
};

/**
 * The exercise before its first set: what it is, what it is for, and how not to
 * do it wrong.
 *
 * The cues are shown on the brief **and** on the set itself. Omar asked for full
 * cues throughout rather than only the first time — see the locked decisions
 * table in docs/PROGRESS.md — and a brief that scrolls away the moment the set
 * starts is not showing them.
 *
 * The three ways out are deliberately three different weights. Starting is the
 * primary button. "Someone is on it" is a real secondary action, because after
 * F9 it is the answer to the most common reason a session goes off-plan.
 * Skipping is a ghost button, because it is the only one of the three that
 * gives up on the movement for the day.
 */
export function ExerciseBriefPanel({
  plannedExercise,
  exercisePosition,
  exerciseCount,
  loggedSetCount,
  isCalibrationWeek,
  wasWaitingOnAMachine,
  loadChangeCoachLine,
  calibrationCoachLine,
  onExerciseStarted,
  onExerciseParked,
  onExerciseSkipped,
  onMarkedUnavailable,
  onSessionBoardOpened,
}: ExerciseBriefPanelProps) {
  const { availabilityAdjustment } = plannedExercise;

  const replacedExerciseName =
    availabilityAdjustment?.kind === 'substituted'
      ? (findExerciseById(availabilityAdjustment.unavailableExerciseId)?.displayName ??
        availabilityAdjustment.unavailableExerciseId)
      : null;

  return (
    <div className={styles.panel}>
      <div className={styles.positionRow}>
        <p className={styles.position}>
          Exercise {String(exercisePosition)} of {String(exerciseCount)}
        </p>

        <button type="button" className={styles.boardLink} onClick={onSessionBoardOpened}>
          <LayoutGrid size={14} strokeWidth={2} aria-hidden />
          All exercises
        </button>
      </div>

      {wasWaitingOnAMachine ? (
        <GradientSurface variant="outlined" radius="large" className={styles.painNotice}>
          <IconBadge icon={<Hourglass size={18} strokeWidth={2} />} size="small" />
          <p>
            You put this one aside earlier. Everything else is done, so if the machine is free now,
            this is the last of it.
          </p>
        </GradientSurface>
      ) : null}

      {/*
       * F13's "ask me first". The swap has already happened in the plan, because
       * the weight and the history have to belong to the movement actually being
       * performed — but it is never silent, and the two buttons below are the
       * choice: start it, or skip it because that is not right either.
       */}
      {replacedExerciseName ? (
        <GradientSurface variant="outlined" radius="large" className={styles.painNotice}>
          <IconBadge icon={<Replace size={18} strokeWidth={2} />} size="small" />
          <p>
            You said your gym has not got the {replacedExerciseName}, so this is in its place. Use
            it, or skip it if it is not right either.
          </p>
        </GradientSurface>
      ) : null}

      {availabilityAdjustment?.kind === 'noSubstituteFound' ? (
        <GradientSurface variant="outlined" radius="large" className={styles.painNotice}>
          <IconBadge icon={<Replace size={18} strokeWidth={2} />} tone="warning" size="small" />
          <p>
            You said your gym has not got this one, and there is nothing equivalent left to offer.
            Skip it, or do it anyway if it has turned up.
          </p>
        </GradientSurface>
      ) : null}

      <ExerciseReferenceContent plannedExercise={plannedExercise} />

      {plannedExercise.isFlaggedForPain ? (
        <GradientSurface variant="outlined" radius="large" className={styles.painNotice}>
          <IconBadge
            icon={<AlertTriangle size={18} strokeWidth={2} />}
            tone="warning"
            size="small"
          />
          <p>
            This one caused sharp pain last time, so the weight has come down. Stop the set the
            moment it does it again.
          </p>
        </GradientSurface>
      ) : null}

      {isCalibrationWeek && calibrationCoachLine ? (
        <GradientSurface variant="accent" radius="large" className={styles.coachNotice}>
          <IconBadge icon={<Lightbulb size={18} strokeWidth={2} />} size="small" isSolid />
          <p>{calibrationCoachLine}</p>
        </GradientSurface>
      ) : null}

      {loadChangeCoachLine ? (
        <GradientSurface variant="accent" radius="large" className={styles.coachNotice}>
          <IconBadge icon={<TrendingUp size={18} strokeWidth={2} />} size="small" isSolid />
          <p>{loadChangeCoachLine}</p>
        </GradientSurface>
      ) : null}

      {plannedExercise.slotNote ? (
        <GradientSurface variant="recessed" radius="large" className={styles.note}>
          <p>{plannedExercise.slotNote}</p>
        </GradientSurface>
      ) : null}

      <div className={styles.actions}>
        <GradientButton
          tone="primary"
          size="large"
          isFullWidth
          onClick={onExerciseStarted}
          trailingIcon={<ChevronRight size={18} strokeWidth={2.5} aria-hidden />}
        >
          {resolveStartLabel(plannedExercise, loggedSetCount, replacedExerciseName !== null)}
        </GradientButton>

        <GradientButton
          tone="secondary"
          isFullWidth
          onClick={onExerciseParked}
          leadingIcon={<Hourglass size={16} strokeWidth={2} aria-hidden />}
        >
          Machine is busy
        </GradientButton>

        <GradientButton
          tone="ghost"
          isFullWidth
          onClick={onExerciseSkipped}
          leadingIcon={<SkipForward size={16} strokeWidth={2} aria-hidden />}
        >
          Skip this exercise
        </GradientButton>

        {/*
         * A link rather than a fourth button, on purpose. This is the one
         * control on the screen that changes future sessions rather than this
         * one, and it should not look like the three that do not.
         */}
        <button type="button" className={styles.unavailableLink} onClick={onMarkedUnavailable}>
          My gym has not got this machine
        </button>
      </div>
    </div>
  );
}

/**
 * The words on the primary button.
 *
 * "Use this instead" is F13's half of the choice — Omar asked to be told about a
 * swap rather than have it happen quietly, and a button that says what it is
 * agreeing to is a cleaner way to ask than a second dialog. It only appears
 * before the first set: by set 2 the swap has been accepted and is old news.
 */
function resolveStartLabel(
  plannedExercise: PlannedExercise,
  loggedSetCount: number,
  wasSubstituted: boolean,
): string {
  if (loggedSetCount > 0) {
    return `Start set ${String(loggedSetCount + 1)}`;
  }

  if (wasSubstituted) {
    return 'Use this instead';
  }

  return `Start ${plannedExercise.prescription.kind === 'steadyStateCardio' ? 'the finisher' : 'set 1'}`;
}
