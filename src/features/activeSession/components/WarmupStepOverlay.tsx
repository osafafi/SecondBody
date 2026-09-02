import { ArrowLeft, Check } from 'lucide-react';

import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { findExerciseById } from '@/content/exercises/allExercises';
import type { PlannedWarmupStep } from '@/domain/warmupPlanning';

import { describeWarmupVolume } from '../warmupWording';
import styles from './WarmupStepOverlay.module.css';

export type WarmupStepOverlayProps = {
  step: PlannedWarmupStep;
  isCompleted: boolean;

  onCompletionToggled: () => void;
  onClosed: () => void;
};

/**
 * One warm-up drill, explained.
 *
 * F11: "i didn't fully understand what each means." Every one of these
 * movements already carries four form cues, the two ways it goes wrong and a
 * sentence on why it is in the programme — `src/content/exercises/` has had all
 * of it since M2. The warm-up panel was showing the name, the dose and a
 * six-word purpose, and nothing else, so the answer was written down and not
 * being read.
 *
 * This is the same shape as `ExercisePreviewOverlay` and deliberately so: a
 * warm-up drill is a movement he has to perform correctly, exactly like a
 * working set, and the reason it needed its own component rather than sharing
 * that one is that a drill is counted in reps or seconds instead of kilograms.
 */
export function WarmupStepOverlay({
  step,
  isCompleted,
  onCompletionToggled,
  onClosed,
}: WarmupStepOverlayProps) {
  const exercise = findExerciseById(step.exerciseId);
  const displayName = exercise?.displayName ?? step.exerciseId;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Warm-up drill">
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onClosed}>
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          The warm-up
        </button>

        <p className={styles.standing}>
          {isCompleted ? 'Done' : `Step ${String(step.orderIndex)}`}
        </p>
      </header>

      <GradientSurface variant="elevated" radius="xlarge" className={styles.headlineSurface}>
        <ExerciseAnimation
          exerciseId={step.exerciseId}
          displayName={displayName}
          primaryMuscleGroups={exercise?.primaryMuscleGroups ?? []}
          className={styles.animation ?? ''}
        />

        <h2 className={styles.name}>{displayName}</h2>
        <p className={styles.volume}>{describeWarmupVolume(step.volume)}</p>
        <p className={styles.purpose}>{step.purpose}</p>
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
            <h3 className={styles.cueHeading}>Why it is in your warm-up</h3>
            <p className={styles.reason}>{exercise.whyItIsInTheProgramme}</p>
          </GradientSurface>
        </>
      ) : null}

      <div className={styles.actions}>
        <GradientButton
          tone={isCompleted ? 'secondary' : 'primary'}
          size="large"
          isFullWidth
          onClick={() => {
            onCompletionToggled();
            onClosed();
          }}
          leadingIcon={<Check size={18} strokeWidth={2.5} aria-hidden />}
        >
          {isCompleted ? 'Actually, not done yet' : 'Done — next one'}
        </GradientButton>

        <GradientButton tone="ghost" isFullWidth onClick={onClosed}>
          Back to the warm-up
        </GradientButton>
      </div>
    </div>
  );
}
