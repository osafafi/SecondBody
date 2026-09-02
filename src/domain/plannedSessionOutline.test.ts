import { describe, expect, it } from 'vitest';

import { twelveWeekFoundationProgram } from '@/content/programs/twelveWeekFoundation/twelveWeekFoundationProgram';

import {
  buildPlannedSessionOutline,
  type PlannedSessionOutlineInput,
} from './plannedSessionOutline';
import { resolveSessionPlan } from './sessionPlanning';

/*
 * Against the real programme, for the same reason `sessionPlanning.test.ts` is:
 * the thing worth proving is that the rules and the shipped content agree. A
 * fixture programme would only prove they agree with a fixture.
 */
function buildInput(
  overrides: Partial<PlannedSessionOutlineInput> = {},
): PlannedSessionOutlineInput {
  return {
    programTemplate: twelveWeekFoundationProgram,
    weekNumber: 1,
    sessionLetter: 'A',
    activePainAreas: [],
    excludedExerciseIds: [],
    unavailableExerciseIds: [],
    resolveSubstituteExerciseIds: () => [],
    ...overrides,
  };
}

describe('buildPlannedSessionOutline', () => {
  it('names the session, the week and the phase it belongs to', () => {
    const outline = buildPlannedSessionOutline(buildInput({ weekNumber: 6, sessionLetter: 'B' }));

    expect(outline?.displayName).toBe('Push & Hinge');
    expect(outline?.weekNumber).toBe(6);
    expect(outline?.totalWeekCount).toBe(twelveWeekFoundationProgram.totalWeekCount);
    expect(outline?.phaseNumber).toBe(2);
    expect(outline?.phaseDisplayName).toBe('Add load');
  });

  it('carries the week facts a preview has to be honest about', () => {
    const calibrationWeek = buildPlannedSessionOutline(buildInput({ weekNumber: 1 }));

    expect(calibrationWeek?.isCalibrationWeek).toBe(true);
    expect(calibrationWeek?.workingSetCount).toBeGreaterThan(0);
  });

  it('returns the slots in the order the session performs them', () => {
    const outline = buildPlannedSessionOutline(buildInput());
    const orderIndexes = outline?.slots.map((slot) => slot.orderIndex) ?? [];

    expect(orderIndexes.length).toBeGreaterThan(1);
    expect(orderIndexes).toEqual([...orderIndexes].sort((first, second) => first - second));
  });

  it('drops an excluded exercise, the way the session itself would', () => {
    const excludedExerciseId = buildPlannedSessionOutline(buildInput())?.slots[0]?.exerciseId;

    const outline = buildPlannedSessionOutline(
      buildInput({ excludedExerciseIds: [excludedExerciseId ?? ''] }),
    );

    expect(outline?.slots.map((slot) => slot.exerciseId)).not.toContain(excludedExerciseId);
  });

  it('lists exactly the movements the session will contain', () => {
    /*
     * The reason this outline borrows `isExerciseSlotAvailable` rather than
     * reading the template directly. A preview that shows a movement the session
     * then drops — or drops one the session shows — is worse than no preview.
     */
    const shoulderSensitive = {
      weekNumber: 6,
      sessionLetter: 'B' as const,
      activePainAreas: ['shoulders' as const],
    };

    const outline = buildPlannedSessionOutline(buildInput(shoulderSensitive));

    const plan = resolveSessionPlan({
      programTemplate: twelveWeekFoundationProgram,
      weekNumber: shoulderSensitive.weekNumber,
      sessionLetter: shoulderSensitive.sessionLetter,
      sessionStartHourOfDay: 18,
      performanceHistoryByExerciseId: {},
      activePainAreas: shoulderSensitive.activePainAreas,
      excludedExerciseIds: [],
      unavailableExerciseIds: [],
      resolveSubstituteExerciseIds: () => [],
      resolveLoadingStyleForExercise: () => null,
      layoffLoadMultiplier: 1,
    });

    expect(outline?.slots.map((slot) => slot.exerciseId)).toEqual(
      plan?.exercises.map((exercise) => exercise.exerciseId),
    );
  });

  it('returns null for a week the programme does not have', () => {
    expect(buildPlannedSessionOutline(buildInput({ weekNumber: 99 }))).toBeNull();
  });
});
