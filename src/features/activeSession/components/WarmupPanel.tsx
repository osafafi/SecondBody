import { useState } from 'react';
import { Check, ChevronRight, Flame, Sunrise } from 'lucide-react';

import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { findExerciseById } from '@/content/exercises/allExercises';
import type { PlannedRampSet } from '@/domain/sessionPlanning';
import type { PlannedWarmup, PlannedWarmupStep } from '@/domain/warmupPlanning';

import {
  describeEstimatedWarmupDuration,
  describeWarmupProgress,
  describeWarmupVolume,
} from '../warmupWording';
import styles from './WarmupPanel.module.css';
import { WarmupStepOverlay } from './WarmupStepOverlay';

export type WarmupPanelProps = {
  warmup: PlannedWarmup;
  rampSet: PlannedRampSet | null;
  coachLine: string | null;
  onWarmupFinished: () => void;
};

/**
 * The warm-up drills and the ramp set, worked through in whatever order the gym
 * allows.
 *
 * The ticks are deliberately not stored anywhere. The warm-up is not logged —
 * `WorkoutSession` records working sets — so these exist purely so he can keep
 * his place in a list of eight things while holding a phone, and they vanish
 * with the screen.
 *
 * The warm-up is training, not padding, which is why it is a step of its own
 * rather than a line of text above the first exercise. F11 is the consequence of
 * that being true and the screen not acting like it: seven movements were listed
 * as names, doses and a six-word purpose, with no picture and no way to find out
 * what any of them actually was.
 *
 * **Every row is two controls, not one.** The tick marks it done; everything
 * else on the row opens it. One target that did both is what "i couldnt click on
 * each step" describes — tapping to find out what a movement was would have
 * ticked it off instead.
 *
 * **Nothing here is a sequence.** It never was in the code, but it read like
 * one, so it now says so: the order is a suggestion, and a busy corner is a
 * reason to do the next one first.
 */
export function WarmupPanel({ warmup, rampSet, coachLine, onWarmupFinished }: WarmupPanelProps) {
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [openedStepId, setOpenedStepId] = useState<string | null>(null);

  const toggleStep = (exerciseId: string) => {
    setCompletedStepIds((completedIds) =>
      completedIds.includes(exerciseId)
        ? completedIds.filter((completedId) => completedId !== exerciseId)
        : [...completedIds, exerciseId],
    );
  };

  const rampSetExercise = rampSet ? findExerciseById(rampSet.exerciseId) : null;
  const openedStep = warmup.steps.find((step) => step.exerciseId === openedStepId) ?? null;

  const completedStepCount = warmup.steps.filter((step) =>
    completedStepIds.includes(step.exerciseId),
  ).length;

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
          {describeEstimatedWarmupDuration(warmup.estimatedDurationSeconds)}
          {warmup.isMorningVersion ? ' · longer, because you have just got up' : ''}
        </p>

        {coachLine ? <p className={styles.coachLine}>{coachLine}</p> : null}
      </GradientSurface>

      <div className={styles.progressRow}>
        <p className={styles.progressCount}>
          {describeWarmupProgress(completedStepCount, warmup.steps.length)}
        </p>
        <p className={styles.progressNote}>Any order. Tap one to see what it is.</p>
      </div>

      <ul className={styles.stepList}>
        {warmup.steps.map((step) => (
          <WarmupStepRow
            key={step.exerciseId}
            step={step}
            isCompleted={completedStepIds.includes(step.exerciseId)}
            onCompletionToggled={() => {
              toggleStep(step.exerciseId);
            }}
            onOpened={() => {
              setOpenedStepId(step.exerciseId);
            }}
          />
        ))}
      </ul>

      {rampSet ? (
        <GradientSurface variant="outlined" radius="large" className={styles.rampSet}>
          <ExerciseAnimation
            exerciseId={rampSet.exerciseId}
            displayName={rampSetExercise?.displayName ?? rampSet.exerciseId}
            primaryMuscleGroups={rampSetExercise?.primaryMuscleGroups ?? []}
            className={styles.rampSetAnimation ?? ''}
          />

          <div className={styles.rampSetText}>
            <p className={styles.rampSetLabel}>Then one light set</p>
            <p className={styles.rampSetDetail}>
              {rampSetExercise?.displayName ?? rampSet.exerciseId} ·{' '}
              {String(rampSet.weightKilograms)} kg × {String(rampSet.reps)}
            </p>
            <p className={styles.rampSetNote}>Rehearsal, not work. It should feel like nothing.</p>
          </div>
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

      {openedStep ? (
        <WarmupStepOverlay
          step={openedStep}
          isCompleted={completedStepIds.includes(openedStep.exerciseId)}
          onCompletionToggled={() => {
            toggleStep(openedStep.exerciseId);
          }}
          onClosed={() => {
            setOpenedStepId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function WarmupStepRow({
  step,
  isCompleted,
  onCompletionToggled,
  onOpened,
}: {
  step: PlannedWarmupStep;
  isCompleted: boolean;
  onCompletionToggled: () => void;
  onOpened: () => void;
}) {
  const exercise = findExerciseById(step.exerciseId);
  const displayName = exercise?.displayName ?? step.exerciseId;

  return (
    <li className={[styles.step, isCompleted ? styles.isCompleted : ''].filter(Boolean).join(' ')}>
      {/*
       * Two siblings rather than a button inside a button, which is invalid and
       * which browsers resolve by ignoring the inner one. The row is drawn as
       * one card; it is operated as two.
       */}
      <button
        type="button"
        className={styles.stepTickButton}
        onClick={onCompletionToggled}
        aria-pressed={isCompleted}
        aria-label={isCompleted ? `Mark ${displayName} as not done` : `Mark ${displayName} as done`}
      >
        <span className={styles.stepTick} aria-hidden>
          {isCompleted ? <Check size={16} strokeWidth={3} /> : null}
        </span>
      </button>

      <button type="button" className={styles.stepOpenButton} onClick={onOpened}>
        <ExerciseAnimation
          exerciseId={step.exerciseId}
          displayName={displayName}
          primaryMuscleGroups={exercise?.primaryMuscleGroups ?? []}
          className={styles.stepAnimation ?? ''}
        />

        <span className={styles.stepText}>
          <span className={styles.stepName}>{displayName}</span>
          <span className={styles.stepVolume}>{describeWarmupVolume(step.volume)}</span>
          <span className={styles.stepPurpose}>{step.purpose}</span>
        </span>

        <span className={styles.stepChevron} aria-hidden>
          <ChevronRight size={18} strokeWidth={2.5} />
        </span>
      </button>
    </li>
  );
}
