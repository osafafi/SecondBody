import { createElement } from 'react';
import { Sparkles, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';

import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { findExerciseById } from '@/content/exercises/allExercises';
import type { PlannedExercise } from '@/domain/sessionPlanning';

import {
  describeLoadChange,
  describePrescriptionHeadline,
  type LoadChangeDescription,
} from '../prescriptionWording';
import styles from './ExerciseReferenceContent.module.css';

const ICON_BY_LOAD_CHANGE_DIRECTION: Record<LoadChangeDescription['direction'], LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  firstTime: Sparkles,
};

export type ExerciseReferenceContentProps = {
  plannedExercise: PlannedExercise;
};

/**
 * What one movement is, what it asks for, and how not to do it wrong.
 *
 * Extracted from `ExerciseBriefPanel` when F8 gave it a second reader. Looking
 * an exercise up mid-session and being about to perform it are the same
 * question — "what is this and how do I do it" — and answering it twice in two
 * files is how the two answers start disagreeing.
 *
 * What is deliberately *not* here is everything that depends on where the
 * session is: the coach's lines, the calibration notice, the pain flag and the
 * buttons. Those belong to whichever panel is drawing this, because they are
 * the difference between reading about a movement and standing in front of it.
 */
export function ExerciseReferenceContent({ plannedExercise }: ExerciseReferenceContentProps) {
  const exercise = findExerciseById(plannedExercise.exerciseId);
  const headline = describePrescriptionHeadline(plannedExercise);
  const loadChange = describeLoadChange(plannedExercise.prescription);

  return (
    <>
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
    </>
  );
}
