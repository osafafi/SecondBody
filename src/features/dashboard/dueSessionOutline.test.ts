import { describe, expect, it } from 'vitest';

import { findExerciseById } from '@/content/exercises/allExercises';
import { twelveWeekFoundationProgram } from '@/content/programs/twelveWeekFoundation/twelveWeekFoundationProgram';
import { resolveSessionPlan } from '@/domain/sessionPlanning';

import { resolveDueSessionOutline } from './dueSessionOutline';

/**
 * The outline exists so the Today screen can say what a session contains without
 * prescribing any of it. The test that matters is the last one: the movements it
 * lists have to be exactly the movements the session will hold.
 */
const programTemplate = twelveWeekFoundationProgram;

describe('resolveDueSessionOutline', () => {
  it('describes the session due', () => {
    const outline = resolveDueSessionOutline({
      programTemplate,
      weekNumber: 2,
      sessionLetter: 'B',
      activePainAreas: [],
      excludedExerciseIds: [],
    });

    expect(outline?.sessionLetter).toBe('B');
    expect(outline?.displayName).not.toBe('');
    expect(outline?.weekNumber).toBe(2);
    expect(outline?.totalWeekCount).toBe(12);
    expect(outline?.phaseDisplayName).not.toBe('');
    expect(outline?.movementNames.length).toBeGreaterThan(0);
  });

  it('flags the calibration week', () => {
    const outline = resolveDueSessionOutline({
      programTemplate,
      weekNumber: 1,
      sessionLetter: 'A',
      activePainAreas: [],
      excludedExerciseIds: [],
    });

    expect(outline?.isCalibrationWeek).toBe(true);
    expect(outline?.isDeloadWeek).toBe(false);
  });

  it('flags the deload week', () => {
    const deloadWeekNumber = programTemplate.phases
      .flatMap((phase) => phase.weeks)
      .find((week) => week.isDeloadWeek)?.weekNumber;

    const outline = resolveDueSessionOutline({
      programTemplate,
      weekNumber: deloadWeekNumber ?? 1,
      sessionLetter: 'A',
      activePainAreas: [],
      excludedExerciseIds: [],
    });

    expect(outline?.isDeloadWeek).toBe(true);
  });

  it('lists movements by display name, in session order', () => {
    const outline = resolveDueSessionOutline({
      programTemplate,
      weekNumber: 2,
      sessionLetter: 'A',
      activePainAreas: [],
      excludedExerciseIds: [],
    });

    // Names rather than ids: nothing on the screen should read as camelCase.
    expect(outline?.movementNames.every((name) => !name.includes('_'))).toBe(true);
    expect(outline?.movementNames[0]).toBe(findExerciseById('gobletSquatToBox')?.displayName);
  });

  it('drops an exercise the profile rules out', () => {
    const outline = resolveDueSessionOutline({
      programTemplate,
      weekNumber: 2,
      sessionLetter: 'A',
      activePainAreas: [],
      excludedExerciseIds: ['gobletSquatToBox'],
    });

    expect(outline?.movementNames).not.toContain(findExerciseById('gobletSquatToBox')?.displayName);
  });

  it('returns null for a week the programme does not have', () => {
    expect(
      resolveDueSessionOutline({
        programTemplate,
        weekNumber: 99,
        sessionLetter: 'A',
        activePainAreas: [],
        excludedExerciseIds: [],
      }),
    ).toBeNull();
  });
});

describe('resolveDueSessionOutline agrees with the session that follows it', () => {
  /**
   * The one that matters. A movement named on the dashboard and then missing
   * from the session — or the other way round — is the bug this outline was
   * built to make impossible, and it is only impossible while both go through
   * `isExerciseSlotAvailable`.
   */
  it.each([
    { weekNumber: 2, sessionLetter: 'A' as const, painAreas: [] },
    { weekNumber: 6, sessionLetter: 'B' as const, painAreas: [] },
    { weekNumber: 6, sessionLetter: 'B' as const, painAreas: ['shoulders' as const] },
    { weekNumber: 10, sessionLetter: 'C' as const, painAreas: ['knees' as const] },
  ])(
    'lists the same movements as week $weekNumber session $sessionLetter',
    ({ weekNumber, sessionLetter, painAreas }) => {
      const outline = resolveDueSessionOutline({
        programTemplate,
        weekNumber,
        sessionLetter,
        activePainAreas: painAreas,
        excludedExerciseIds: [],
      });

      const plan = resolveSessionPlan({
        programTemplate,
        weekNumber,
        sessionLetter,
        sessionStartHourOfDay: 18,
        performanceHistoryByExerciseId: {},
        activePainAreas: painAreas,
        excludedExerciseIds: [],
        resolveLoadingStyleForExercise: (exerciseId) =>
          findExerciseById(exerciseId)?.loadingStyle ?? null,
        layoffLoadMultiplier: 1,
      });

      const plannedNames = (plan?.exercises ?? []).map(
        (exercise) => findExerciseById(exercise.exerciseId)?.displayName ?? exercise.exerciseId,
      );

      expect(outline?.movementNames).toEqual(plannedNames);
    },
  );
});
