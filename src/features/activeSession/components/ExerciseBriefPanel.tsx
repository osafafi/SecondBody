import {
  AlertTriangle,
  ChevronRight,
  Hourglass,
  LayoutGrid,
  Lightbulb,
  SkipForward,
  TrendingUp,
} from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
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
  onSessionBoardOpened,
}: ExerciseBriefPanelProps) {
  const hasSetsAlready = loggedSetCount > 0;

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
          {hasSetsAlready
            ? `Start set ${String(loggedSetCount + 1)}`
            : `Start ${plannedExercise.prescription.kind === 'steadyStateCardio' ? 'the finisher' : 'set 1'}`}
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
      </div>
    </div>
  );
}
