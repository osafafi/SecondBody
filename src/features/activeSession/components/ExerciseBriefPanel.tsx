import { createElement } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Lightbulb,
  Sparkles,
  SkipForward,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { findExerciseById } from '@/content/exercises/allExercises';
import type { PlannedExercise } from '@/domain/sessionPlanning';

import {
  describeLoadChange,
  describePrescriptionHeadline,
  type LoadChangeDescription,
} from '../prescriptionWording';
import styles from './ExerciseBriefPanel.module.css';

const ICON_BY_LOAD_CHANGE_DIRECTION: Record<LoadChangeDescription['direction'], LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  firstTime: Sparkles,
};

export type ExerciseBriefPanelProps = {
  plannedExercise: PlannedExercise;

  /** 1-based, for "3 of 6". */
  exercisePosition: number;
  exerciseCount: number;

  /** How many sets of this exercise are already logged. */
  loggedSetCount: number;

  /** Week 1 has no prescription to trust yet, so it explains itself instead. */
  isCalibrationWeek: boolean;

  loadChangeCoachLine: string | null;
  calibrationCoachLine: string | null;

  onExerciseStarted: () => void;
  onExerciseSkipped: () => void;
};

/**
 * The exercise before its first set: what it is, what it is for, and how not to
 * do it wrong.
 *
 * The cues are shown on the brief **and** on the set itself. Omar asked for full
 * cues throughout rather than only the first time — see the locked decisions
 * table in docs/PROGRESS.md — and a brief that scrolls away the moment the set
 * starts is not showing them.
 */
export function ExerciseBriefPanel({
  plannedExercise,
  exercisePosition,
  exerciseCount,
  loggedSetCount,
  isCalibrationWeek,
  loadChangeCoachLine,
  calibrationCoachLine,
  onExerciseStarted,
  onExerciseSkipped,
}: ExerciseBriefPanelProps) {
  const exercise = findExerciseById(plannedExercise.exerciseId);
  const headline = describePrescriptionHeadline(plannedExercise);
  const loadChange = describeLoadChange(plannedExercise.prescription);

  const hasSetsAlready = loggedSetCount > 0;

  return (
    <div className={styles.panel}>
      <p className={styles.position}>
        Exercise {String(exercisePosition)} of {String(exerciseCount)}
      </p>

      <GradientSurface variant="elevated" radius="xlarge" className={styles.headlineSurface}>
        <ExerciseAnimation
          exerciseId={plannedExercise.exerciseId}
          displayName={exercise?.displayName ?? plannedExercise.exerciseId}
          primaryMuscleGroups={exercise?.primaryMuscleGroups ?? []}
          className={styles.animation ?? ''}
        />

        <h2 className={styles.name}>{exercise?.displayName ?? plannedExercise.exerciseId}</h2>

        <p className={styles.headline}>
          <span className={styles.headlineValue}>{headline.value}</span>
          {headline.unit ? <span className={styles.headlineUnit}>{headline.unit}</span> : null}
        </p>

        <p className={styles.headlineDetail}>{headline.detail}</p>

        {loadChange ? (
          <p className={styles.loadChange}>
            {/*
             * createElement rather than JSX: the icon is chosen from a table at
             * render time, and the linter reads `<Icon />` as a component being
             * defined during render.
             */}
            {createElement(ICON_BY_LOAD_CHANGE_DIRECTION[loadChange.direction], {
              size: 14,
              strokeWidth: 2,
              'aria-hidden': true,
            })}
            {loadChange.text}
          </p>
        ) : null}
      </GradientSurface>

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

      {exercise ? (
        <>
          <GradientSurface variant="recessed" radius="large" className={styles.cueGroup}>
            <h3 className={styles.cueHeading}>How to do it</h3>
            <ol className={styles.cueList}>
              {exercise.formCues.map((formCue) => (
                <li key={formCue}>{formCue}</li>
              ))}
            </ol>
          </GradientSurface>

          <GradientSurface variant="recessed" radius="large" className={styles.cueGroup}>
            <h3 className={styles.cueHeading}>What goes wrong</h3>
            <ul className={styles.mistakeList}>
              {exercise.commonMistakes.map((commonMistake) => (
                <li key={commonMistake}>{commonMistake}</li>
              ))}
            </ul>
          </GradientSurface>

          <GradientSurface variant="recessed" radius="large" className={styles.cueGroup}>
            <h3 className={styles.cueHeading}>Why it is in your programme</h3>
            <p className={styles.reason}>{exercise.whyItIsInTheProgramme}</p>
          </GradientSurface>
        </>
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
