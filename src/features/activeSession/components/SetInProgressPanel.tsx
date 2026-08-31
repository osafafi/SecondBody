import { Check, SkipForward } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { findExerciseById } from '@/content/exercises/allExercises';
import type { PlannedExercise } from '@/domain/sessionPlanning';

import { describePrescriptionHeadline } from '../prescriptionWording';
import styles from './SetInProgressPanel.module.css';

export type SetInProgressPanelProps = {
  plannedExercise: PlannedExercise;
  setNumber: number;
  onSetFinished: () => void;
  onExerciseSkipped: () => void;
};

/**
 * The set itself: the weight, the target, and the cues, at arm's length.
 *
 * The weight is the largest thing on the screen because it is the one fact he
 * needs while walking to a machine, and it is read from a metre away with a
 * phone on a bench. `--text-display` exists for exactly this.
 */
export function SetInProgressPanel({
  plannedExercise,
  setNumber,
  onSetFinished,
  onExerciseSkipped,
}: SetInProgressPanelProps) {
  const exercise = findExerciseById(plannedExercise.exerciseId);
  const headline = describePrescriptionHeadline(plannedExercise);

  return (
    <div className={styles.panel}>
      <GradientSurface variant="accent" radius="xlarge" className={styles.target}>
        <p className={styles.setLabel}>
          Set {String(setNumber)} of {String(plannedExercise.workingSetCount)}
        </p>

        <h2 className={styles.exerciseName}>
          {exercise?.displayName ?? plannedExercise.exerciseId}
        </h2>

        <p className={styles.weight}>
          <span className={styles.weightValue}>{headline.value}</span>
          {headline.unit ? <span className={styles.weightUnit}>{headline.unit}</span> : null}
        </p>

        <p className={styles.targetDetail}>{headline.detail}</p>
      </GradientSurface>

      {exercise ? (
        <GradientSurface variant="recessed" radius="large" className={styles.cues}>
          <h3 className={styles.cueHeading}>Keep in mind</h3>
          <ul className={styles.cueList}>
            {exercise.formCues.map((formCue) => (
              <li key={formCue}>{formCue}</li>
            ))}
          </ul>
        </GradientSurface>
      ) : null}

      <div className={styles.actions}>
        <GradientButton
          tone="primary"
          size="large"
          isFullWidth
          onClick={onSetFinished}
          trailingIcon={<Check size={18} strokeWidth={2.5} aria-hidden />}
        >
          Set done
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
