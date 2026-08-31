import { describe, expect, it } from 'vitest';

import { resolveSessionPlan, type SessionPlanRequest } from './sessionPlanning';
import { findExerciseById } from '@/content/exercises/allExercises';
import { twelveWeekFoundationProgram } from '@/content/programs/twelveWeekFoundation/twelveWeekFoundationProgram';
import { buildPerformanceHistory, buildSetsAtReps } from '@/test/trainingTestFactories';
import type { ExercisePerformanceHistory } from '@/types/performanceTypes';

/**
 * These run against the real programme, because the thing worth proving is that
 * the domain rules and the shipped content produce a sensible session together.
 * A fixture programme would only prove they work on a fixture.
 *
 * The loading style lookup is exactly what the app will pass in: the domain
 * layer never reads content itself, so the caller resolves it.
 */
const SEVEN_IN_THE_MORNING = 7;
const SIX_IN_THE_EVENING = 18;

function buildRequest(overrides: Partial<SessionPlanRequest> = {}): SessionPlanRequest {
  return {
    programTemplate: twelveWeekFoundationProgram,
    weekNumber: 1,
    sessionLetter: 'A',
    sessionStartHourOfDay: SIX_IN_THE_EVENING,
    performanceHistoryByExerciseId: {},
    activePainAreas: [],
    excludedExerciseIds: [],
    resolveLoadingStyleForExercise: (exerciseId) =>
      findExerciseById(exerciseId)?.loadingStyle ?? null,
    layoffLoadMultiplier: 1,
    ...overrides,
  };
}

function findPlannedExercise(plan: ReturnType<typeof resolveSessionPlan>, exerciseId: string) {
  return plan?.exercises.find((exercise) => exercise.exerciseId === exerciseId) ?? null;
}

describe('resolveSessionPlan — the shape of a session', () => {
  it('names the phase and the week it is planning', () => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 6, sessionLetter: 'B' }));

    expect(plan?.phaseNumber).toBe(2);
    expect(plan?.phaseDisplayName).toBe('Add load');
    expect(plan?.weekNumber).toBe(6);
    expect(plan?.displayName).toBe('Push & Hinge');
    expect(plan?.targetEffortRange).toEqual({
      minimumRatingOfPerceivedExertion: 6,
      maximumRatingOfPerceivedExertion: 7,
    });
  });

  it('returns the exercises in the order they are performed', () => {
    const plan = resolveSessionPlan(buildRequest());
    const orderIndexes = plan?.exercises.map((exercise) => exercise.orderIndex) ?? [];

    expect(orderIndexes.length).toBeGreaterThan(0);
    expect(orderIndexes).toEqual([...orderIndexes].sort((first, second) => first - second));
  });

  it('finishes every session with cardio, as a single continuous effort', () => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 3, sessionLetter: 'C' }));
    const lastExercise = plan?.exercises.at(-1);

    expect(lastExercise?.prescription.kind).toBe('steadyStateCardio');
    expect(lastExercise?.workingSetCount).toBe(1);
  });

  it('returns null for a week outside the programme', () => {
    expect(resolveSessionPlan(buildRequest({ weekNumber: 0 }))).toBeNull();
    expect(resolveSessionPlan(buildRequest({ weekNumber: 13 }))).toBeNull();
  });
});

describe('resolveSessionPlan — set counts across the phases', () => {
  it.each([
    [1, 2],
    [2, 2],
    [3, 3],
    [5, 3],
    [8, 2],
    [12, 3],
  ])('gives week %i a working set count of %i', (weekNumber, expectedSetCount) => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber }));

    expect(plan?.workingSetCount).toBe(expectedSetCount);
    expect(findPlannedExercise(plan, 'legExtension')?.workingSetCount).toBe(expectedSetCount);
  });
});

describe('resolveSessionPlan — week 1 is calibration', () => {
  it('marks the week and uses the template starting weights', () => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 1 }));
    const legExtension = findPlannedExercise(plan, 'legExtension');

    expect(plan?.isCalibrationWeek).toBe(true);
    expect(legExtension?.prescription).toMatchObject({
      kind: 'weightAndReps',
      prescribedWeightKilograms: 30,
      loadDecisionReason: 'firstTimeCalibration',
    });
  });

  it('treats an exercise with no history as a calibration in any week', () => {
    // The machine shoulder press first appears in Phase 2, so week 5 is its
    // calibration however long the programme has been running.
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 5, sessionLetter: 'B' }));
    const shoulderPress = findPlannedExercise(plan, 'shoulderPressMachine');

    expect(shoulderPress?.prescription).toMatchObject({
      kind: 'weightAndReps',
      prescribedWeightKilograms: 15,
      loadDecisionReason: 'firstTimeCalibration',
    });
  });
});

describe('resolveSessionPlan — progression flows through into the plan', () => {
  const performanceHistoryByExerciseId: Record<string, ExercisePerformanceHistory> = {
    legExtension: buildPerformanceHistory({
      exerciseId: 'legExtension',
      lastPrescribedWeightKilograms: 30,
      lastPrescribedRepRange: { minimumReps: 10, maximumReps: 12 },
      lastPerformedSets: buildSetsAtReps(2, 12),
    }),
  };

  it('adds an increment when every set reached the top of the range', () => {
    const plan = resolveSessionPlan(
      buildRequest({ weekNumber: 2, performanceHistoryByExerciseId }),
    );

    expect(findPlannedExercise(plan, 'legExtension')?.prescription).toMatchObject({
      prescribedWeightKilograms: 32.5,
      loadDecisionReason: 'increasedAfterFullRange',
      changeFromPreviousKilograms: 2.5,
    });
  });

  it('flags an exercise that caused sharp pain and pulls its load back', () => {
    const plan = resolveSessionPlan(
      buildRequest({
        weekNumber: 2,
        performanceHistoryByExerciseId: {
          legExtension: buildPerformanceHistory({
            exerciseId: 'legExtension',
            lastPrescribedWeightKilograms: 30,
            lastPerformedSets: buildSetsAtReps(2, 10).map((performedSet, index) =>
              index === 0 ? { ...performedSet, didCauseSharpPain: true } : performedSet,
            ),
          }),
        },
      }),
    );
    const legExtension = findPlannedExercise(plan, 'legExtension');

    expect(legExtension?.isFlaggedForPain).toBe(true);
    expect(legExtension?.prescription).toMatchObject({
      prescribedWeightKilograms: 22.5,
      loadDecisionReason: 'reducedAfterSharpPain',
    });
  });

  it('climbs the rep range on a bodyweight movement instead of the weight', () => {
    const plan = resolveSessionPlan(
      buildRequest({
        weekNumber: 2,
        sessionLetter: 'C',
        performanceHistoryByExerciseId: {
          splitSquat: buildPerformanceHistory({
            exerciseId: 'splitSquat',
            lastPrescribedWeightKilograms: null,
            lastPrescribedRepRange: { minimumReps: 6, maximumReps: 8 },
            lastPerformedSets: buildSetsAtReps(2, 8),
          }),
        },
      }),
    );

    expect(findPlannedExercise(plan, 'splitSquat')?.prescription).toMatchObject({
      kind: 'bodyweightReps',
      repRange: { minimumReps: 8, maximumReps: 10 },
      repRangeDecisionReason: 'increasedAfterFullRange',
    });
  });
});

describe('resolveSessionPlan — the deload week', () => {
  it('drops both the sets and the load', () => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 8 }));

    expect(plan?.isDeloadWeek).toBe(true);
    expect(plan?.workingSetCount).toBe(2);
    // 30 kg less twenty percent is 24, rounded down to a selectable 22.5.
    expect(findPlannedExercise(plan, 'legExtension')?.prescription).toMatchObject({
      prescribedWeightKilograms: 22.5,
    });
  });

  it('leaves every other week at full load', () => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 7 }));

    expect(plan?.isDeloadWeek).toBe(false);
    expect(findPlannedExercise(plan, 'legExtension')?.prescription).toMatchObject({
      prescribedWeightKilograms: 30,
    });
  });
});

describe('resolveSessionPlan — coming back from a layoff', () => {
  it('applies the eighty percent multiplier on top of the week', () => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 2, layoffLoadMultiplier: 0.8 }));

    expect(findPlannedExercise(plan, 'legExtension')?.prescription).toMatchObject({
      prescribedWeightKilograms: 22.5,
    });
  });
});

describe('resolveSessionPlan — the conditional shoulder press', () => {
  it('appears in Phase 2 Session B while the shoulders are clear', () => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 6, sessionLetter: 'B' }));

    expect(findPlannedExercise(plan, 'shoulderPressMachine')).not.toBeNull();
  });

  it('disappears entirely once shoulder pain is on the profile', () => {
    const plan = resolveSessionPlan(
      buildRequest({ weekNumber: 6, sessionLetter: 'B', activePainAreas: ['shoulders'] }),
    );

    expect(findPlannedExercise(plan, 'shoulderPressMachine')).toBeNull();
  });

  it('leaves the rest of the session untouched when it is dropped', () => {
    const withoutPain = resolveSessionPlan(buildRequest({ weekNumber: 6, sessionLetter: 'B' }));
    const withPain = resolveSessionPlan(
      buildRequest({ weekNumber: 6, sessionLetter: 'B', activePainAreas: ['shoulders'] }),
    );

    expect(withPain?.exercises).toHaveLength((withoutPain?.exercises.length ?? 0) - 1);
    expect(findPlannedExercise(withPain, 'cableFacePull')).not.toBeNull();
  });

  it('is unaffected by pain somewhere it does not care about', () => {
    const plan = resolveSessionPlan(
      buildRequest({ weekNumber: 6, sessionLetter: 'B', activePainAreas: ['knees'] }),
    );

    expect(findPlannedExercise(plan, 'shoulderPressMachine')).not.toBeNull();
  });
});

describe('resolveSessionPlan — exercises the profile rules out', () => {
  it('drops a blacklisted exercise from the session', () => {
    const plan = resolveSessionPlan(buildRequest({ excludedExerciseIds: ['gobletSquatToBox'] }));

    expect(findPlannedExercise(plan, 'gobletSquatToBox')).toBeNull();
    expect(findPlannedExercise(plan, 'seatedCableRow')).not.toBeNull();
  });

  it('beats a slot that has no pain condition on it at all', () => {
    const withoutExclusion = resolveSessionPlan(buildRequest());
    const withExclusion = resolveSessionPlan(
      buildRequest({ excludedExerciseIds: ['seatedCableRow'] }),
    );

    expect(withExclusion?.exercises).toHaveLength((withoutExclusion?.exercises.length ?? 0) - 1);
  });

  it('moves the ramp set on when the first exercise is the one ruled out', () => {
    const plan = resolveSessionPlan(buildRequest({ excludedExerciseIds: ['gobletSquatToBox'] }));

    expect(plan?.rampSet?.exerciseId).toBe('seatedCableRow');
  });
});

describe('resolveSessionPlan — the warm-up and the ramp set', () => {
  it('takes the longer warm-up for a morning session', () => {
    const plan = resolveSessionPlan(buildRequest({ sessionStartHourOfDay: SEVEN_IN_THE_MORNING }));

    expect(plan?.warmup.isMorningVersion).toBe(true);
  });

  it('takes the shorter one later in the day', () => {
    const plan = resolveSessionPlan(buildRequest({ sessionStartHourOfDay: SIX_IN_THE_EVENING }));

    expect(plan?.warmup.isMorningVersion).toBe(false);
  });

  it('ramps the first exercise at half its working weight', () => {
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 1 }));

    expect(plan?.rampSet).toEqual({
      exerciseId: 'gobletSquatToBox',
      reps: 10,
      // Half of 10 kg is 5, and the nearest dumbbell at or below that is 4.
      weightKilograms: 4,
    });
  });

  it('ramps whatever the first exercise happens to be in that phase', () => {
    // Phase 2 promotes the incline dumbbell press to the front of Session B.
    const plan = resolveSessionPlan(buildRequest({ weekNumber: 5, sessionLetter: 'B' }));

    expect(plan?.rampSet?.exerciseId).toBe('inclineDumbbellPress');
  });
});
