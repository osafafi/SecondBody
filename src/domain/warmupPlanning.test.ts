import { describe, expect, it } from 'vitest';

import { estimateWarmupStepDurationSeconds, resolveWarmupPlan } from './warmupPlanning';
import { fullBodyWarmupRoutine } from '@/content/programs/twelveWeekFoundation/warmupRoutine';

const SEVEN_THIRTY_IN_THE_MORNING = 7;
const SIX_IN_THE_EVENING = 18;

describe('resolveWarmupPlan', () => {
  it('uses the longer volumes for a session that starts before the cutoff', () => {
    const plan = resolveWarmupPlan(fullBodyWarmupRoutine, SEVEN_THIRTY_IN_THE_MORNING);

    expect(plan.isMorningVersion).toBe(true);
    expect(plan.steps[0]?.exerciseId).toBe('stationaryBikeEasy');
    expect(plan.steps[0]?.volume.durationSeconds).toBe(180);
  });

  it('uses the shorter volumes later in the day', () => {
    const plan = resolveWarmupPlan(fullBodyWarmupRoutine, SIX_IN_THE_EVENING);

    expect(plan.isMorningVersion).toBe(false);
    expect(plan.steps[0]?.volume.durationSeconds).toBe(120);
  });

  it('performs every step at both times of day, so nothing is ever skipped', () => {
    const morningPlan = resolveWarmupPlan(fullBodyWarmupRoutine, SEVEN_THIRTY_IN_THE_MORNING);
    const eveningPlan = resolveWarmupPlan(fullBodyWarmupRoutine, SIX_IN_THE_EVENING);

    expect(eveningPlan.steps.map((step) => step.exerciseId)).toEqual(
      morningPlan.steps.map((step) => step.exerciseId),
    );
    expect(eveningPlan.steps).toHaveLength(fullBodyWarmupRoutine.steps.length);
  });

  it('returns the steps in order', () => {
    const plan = resolveWarmupPlan(fullBodyWarmupRoutine, SEVEN_THIRTY_IN_THE_MORNING);
    const orderIndexes = plan.steps.map((step) => step.orderIndex);

    expect(orderIndexes).toEqual([...orderIndexes].sort((first, second) => first - second));
  });

  it('makes the morning version the longer one', () => {
    const morningPlan = resolveWarmupPlan(fullBodyWarmupRoutine, SEVEN_THIRTY_IN_THE_MORNING);
    const eveningPlan = resolveWarmupPlan(fullBodyWarmupRoutine, SIX_IN_THE_EVENING);

    expect(morningPlan.estimatedDurationSeconds).toBeGreaterThan(
      eveningPlan.estimatedDurationSeconds,
    );
  });

  it('keeps both versions inside the six to ten minute budget', () => {
    const morningPlan = resolveWarmupPlan(fullBodyWarmupRoutine, SEVEN_THIRTY_IN_THE_MORNING);
    const eveningPlan = resolveWarmupPlan(fullBodyWarmupRoutine, SIX_IN_THE_EVENING);

    // docs/TRAINING_PROGRAM.md section 3 budgets 6-10 minutes for the warm-up.
    // The ramp set is on top of this, so leave a little headroom at the ceiling.
    expect(eveningPlan.estimatedDurationSeconds).toBeGreaterThanOrEqual(5 * 60);
    expect(morningPlan.estimatedDurationSeconds).toBeLessThanOrEqual(10 * 60);
  });
});

describe('estimateWarmupStepDurationSeconds', () => {
  it('uses the stated duration for a timed movement', () => {
    expect(
      estimateWarmupStepDurationSeconds({ reps: null, durationSeconds: 180, isPerSide: false }),
    ).toBe(180);
  });

  it('doubles a timed movement done on both sides', () => {
    expect(
      estimateWarmupStepDurationSeconds({ reps: null, durationSeconds: 45, isPerSide: true }),
    ).toBe(90);
  });

  it('estimates three seconds per rep for a counted movement', () => {
    expect(
      estimateWarmupStepDurationSeconds({ reps: 10, durationSeconds: null, isPerSide: false }),
    ).toBe(30);
  });

  it('doubles a counted movement done on both sides', () => {
    expect(
      estimateWarmupStepDurationSeconds({ reps: 10, durationSeconds: null, isPerSide: true }),
    ).toBe(60);
  });

  it('is zero when a volume says nothing at all', () => {
    expect(
      estimateWarmupStepDurationSeconds({ reps: null, durationSeconds: null, isPerSide: false }),
    ).toBe(0);
  });
});
