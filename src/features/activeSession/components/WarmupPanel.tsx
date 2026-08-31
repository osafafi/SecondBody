import { useState } from 'react';
import { Check, Flame, Sunrise } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { findExerciseById } from '@/content/exercises/allExercises';
import { formatDurationAsMinutesAndSeconds } from '@/domain/restTimer';
import type { PlannedRampSet } from '@/domain/sessionPlanning';
import type { PlannedWarmup } from '@/domain/warmupPlanning';
import type { WarmupVolume } from '@/types/programTypes';

import styles from './WarmupPanel.module.css';

export type WarmupPanelProps = {
  warmup: PlannedWarmup;
  rampSet: PlannedRampSet | null;
  coachLine: string | null;
  onWarmupFinished: () => void;
};

/** "10 reps per side", "30 seconds" — whichever the drill is counted in. */
function describeWarmupVolume(volume: WarmupVolume): string {
  const perSideSuffix = volume.isPerSide ? ' per side' : '';

  if (volume.durationSeconds !== null) {
    return `${String(volume.durationSeconds)} seconds${perSideSuffix}`;
  }

  if (volume.reps !== null) {
    return `${String(volume.reps)} reps${perSideSuffix}`;
  }

  return 'as prescribed';
}

/**
 * The warm-up drills and the ramp set, ticked off one at a time.
 *
 * The ticks are deliberately not stored anywhere. The warm-up is not logged —
 * `WorkoutSession` records working sets — so these exist purely so he can keep
 * his place in a list of eight things while holding a phone, and they vanish
 * with the screen.
 *
 * The warm-up is training, not padding, which is why it is a step of its own
 * rather than a line of text above the first exercise.
 */
export function WarmupPanel({ warmup, rampSet, coachLine, onWarmupFinished }: WarmupPanelProps) {
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);

  const toggleStep = (exerciseId: string) => {
    setCompletedStepIds((completedIds) =>
      completedIds.includes(exerciseId)
        ? completedIds.filter((completedId) => completedId !== exerciseId)
        : [...completedIds, exerciseId],
    );
  };

  const rampSetExercise = rampSet ? findExerciseById(rampSet.exerciseId) : null;

  return (
    <div className={styles.panel}>
      <GradientSurface variant="accent" radius="xlarge" className={styles.intro}>
        <IconBadge
          icon={
            warmup.isMorningVersion ? (
              <Sunrise size={24} strokeWidth={1.75} />
            ) : (
              <Flame size={24} strokeWidth={1.75} />
            )
          }
          size="large"
          isSolid
        />

        <h2 className={styles.title}>{warmup.displayName}</h2>
        <p className={styles.estimate}>
          About {formatDurationAsMinutesAndSeconds(warmup.estimatedDurationSeconds)}
          {warmup.isMorningVersion ? ' · longer, because you have just got up' : ''}
        </p>

        {coachLine ? <p className={styles.coachLine}>{coachLine}</p> : null}
      </GradientSurface>

      <ul className={styles.stepList}>
        {warmup.steps.map((step) => {
          const exercise = findExerciseById(step.exerciseId);
          const isCompleted = completedStepIds.includes(step.exerciseId);

          return (
            <li key={step.exerciseId}>
              <button
                type="button"
                className={[styles.step, isCompleted ? styles.isCompleted : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  toggleStep(step.exerciseId);
                }}
                aria-pressed={isCompleted}
              >
                <span className={styles.stepTick} aria-hidden>
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : null}
                </span>

                <span className={styles.stepText}>
                  <span className={styles.stepName}>
                    {exercise?.displayName ?? step.exerciseId}
                  </span>
                  <span className={styles.stepVolume}>{describeWarmupVolume(step.volume)}</span>
                  <span className={styles.stepPurpose}>{step.purpose}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {rampSet ? (
        <GradientSurface variant="outlined" radius="large" className={styles.rampSet}>
          <p className={styles.rampSetLabel}>Then one light set</p>
          <p className={styles.rampSetDetail}>
            {rampSetExercise?.displayName ?? rampSet.exerciseId} · {String(rampSet.weightKilograms)}{' '}
            kg × {String(rampSet.reps)}
          </p>
          <p className={styles.rampSetNote}>Rehearsal, not work. It should feel like nothing.</p>
        </GradientSurface>
      ) : null}

      <GradientButton
        tone="primary"
        size="large"
        isFullWidth
        onClick={onWarmupFinished}
        trailingIcon={<Check size={18} strokeWidth={2.5} aria-hidden />}
      >
        I&rsquo;m warm
      </GradientButton>
    </div>
  );
}
