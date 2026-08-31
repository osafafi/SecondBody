import type { WarmupRoutine, WarmupVolume } from '@/types/programTypes';

import { isMorningSession } from './sessionScheduling';

/**
 * Turning the warm-up routine into the warm-up for today.
 *
 * The only thing that varies is the dose. Every step is always performed —
 * dropping the shoulder work because it is the afternoon would be a strange way
 * to treat a shoulder — but a session that starts before 10:00 gets the longer
 * volumes, because a body that has just got out of bed is measurably stiffer.
 *
 * Both volumes are written out in the content. This file picks between them.
 */

/** Roughly how long one rep of a mobility drill takes, for the time estimate. */
const ESTIMATED_SECONDS_PER_MOBILITY_REP = 3;

/** Seconds allowed between warm-up steps for walking over and setting up. */
const ESTIMATED_TRANSITION_SECONDS_PER_STEP = 10;

export type PlannedWarmupStep = {
  orderIndex: number;
  exerciseId: string;
  volume: WarmupVolume;
  purpose: string;
};

export type PlannedWarmup = {
  warmupRoutineId: string;
  displayName: string;

  /** True when the longer, morning volumes were chosen. */
  isMorningVersion: boolean;

  steps: PlannedWarmupStep[];

  /** A rough total for the "have I got time for this" decision, not a countdown. */
  estimatedDurationSeconds: number;
};

/** One step's estimated duration, whether it is counted in reps or in seconds. */
export function estimateWarmupStepDurationSeconds(volume: WarmupVolume): number {
  const sideCount = volume.isPerSide ? 2 : 1;

  if (volume.durationSeconds !== null) {
    return volume.durationSeconds * sideCount;
  }

  if (volume.reps !== null) {
    return volume.reps * ESTIMATED_SECONDS_PER_MOBILITY_REP * sideCount;
  }

  return 0;
}

/**
 * The warm-up as it should be performed at this time of day.
 *
 * `sessionStartHourOfDay` is the hour in 24-hour form, passed in by the caller —
 * nothing in `src/domain/` reads a clock.
 */
export function resolveWarmupPlan(
  warmupRoutine: WarmupRoutine,
  sessionStartHourOfDay: number,
): PlannedWarmup {
  const isMorningVersion = isMorningSession(sessionStartHourOfDay, warmupRoutine.morningCutoffHour);

  const steps: PlannedWarmupStep[] = warmupRoutine.steps
    .slice()
    .sort((firstStep, secondStep) => firstStep.orderIndex - secondStep.orderIndex)
    .map((step) => ({
      orderIndex: step.orderIndex,
      exerciseId: step.exerciseId,
      volume: isMorningVersion ? step.morningVolume : step.standardVolume,
      purpose: step.purpose,
    }));

  const estimatedDurationSeconds = steps.reduce(
    (runningTotal, step) =>
      runningTotal +
      estimateWarmupStepDurationSeconds(step.volume) +
      ESTIMATED_TRANSITION_SECONDS_PER_STEP,
    0,
  );

  return {
    warmupRoutineId: warmupRoutine.warmupRoutineId,
    displayName: warmupRoutine.displayName,
    isMorningVersion,
    steps,
    estimatedDurationSeconds,
  };
}
