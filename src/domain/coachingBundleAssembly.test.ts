import { describe, expect, it } from 'vitest';

import { twelveWeekFoundationProgram } from '@/content/programs/twelveWeekFoundation/twelveWeekFoundationProgram';
import type { DailyHabitRecord } from '@/types/dailyTrackingTypes';
import type { ProgramAssignment } from '@/types/trainingHistoryTypes';
import type { UserProfile } from '@/types/userAccountTypes';

import { formatCoachingBundleAsJson } from './coachingBundle';
import {
  assembleCoachingBundle,
  type CoachingBundleAssemblyInput,
  type StoredCoachingData,
} from './coachingBundleAssembly';

const GENERATED_AT = new Date('2026-09-01T10:00:00');

function buildProfile(): UserProfile {
  return {
    displayName: 'Omar',
    birthYear: 1990,
    heightCentimetres: 178,
    startingWeightKilograms: 92,
    targetWeightKilograms: 82,
    painAreas: [],
    excludedExerciseIds: [],
    unavailableExerciseIds: [],
    availableEquipmentIds: [],
    trainingDaysOfWeek: [1, 3, 5],
    hasCompletedOnboarding: true,
    createdAt: new Date('2026-06-01T09:00:00'),
    updatedAt: new Date('2026-08-01T09:00:00'),
  };
}

function buildAssignment(changes: Partial<ProgramAssignment> = {}): ProgramAssignment {
  return {
    programTemplateId: twelveWeekFoundationProgram.programTemplateId,
    startedOn: '2026-08-24',
    currentPhaseNumber: 1,
    currentWeekNumber: 2,
    nextSessionLetter: 'A',
    status: 'active',
    completedOn: null,
    ...changes,
  };
}

function buildHabitRecord(onDate: string, stepCount: number | null): DailyHabitRecord {
  return {
    onDate,
    didHitProteinTarget: true,
    didAvoidLiquidCalories: true,
    didCompleteMobilityRoutine: false,
    stepCount,
    sleepHours: 7.5,
    updatedAt: new Date(`${onDate}T21:00:00`),
  };
}

function buildStoredData(changes: Partial<StoredCoachingData> = {}): StoredCoachingData {
  return {
    profile: buildProfile(),
    assignment: buildAssignment(),
    sessions: [],
    bodyMetricEntries: [],
    habitRecords: [],
    personalRecords: [],
    journalEntries: [],
    ...changes,
  };
}

function buildAssemblyInput(
  changes: Partial<CoachingBundleAssemblyInput> = {},
): CoachingBundleAssemblyInput {
  return {
    generatedAt: GENERATED_AT,
    storedData: buildStoredData(),
    contentFacts: {
      programTemplate: twelveWeekFoundationProgram,
      startingDailyStepTarget: 5000,
      finalDailyStepTarget: 9000,
      nightlySleepTargetHours: 7,
      resolveExerciseName: () => null,
    },
    firstDayOfWeek: 1,
    maximumHabitDayCount: 30,
    ...changes,
  };
}

describe('assembling a bundle from stored documents', () => {
  it('produces a bundle with nothing but a profile and an assignment', () => {
    const bundle = assembleCoachingBundle(buildAssemblyInput());

    expect(bundle.athlete.displayName).toBe('Omar');
    expect(bundle.training.sessions).toEqual([]);
    expect(bundle.journal.awaitingReview).toEqual([]);
  });

  /*
   * The whole reason the habit records go through `buildRecentHabitDays` rather
   * than straight into the bundle. A fortnight with three good days in it is
   * three of fourteen, not three of three.
   */
  it('counts the days nothing was written for', () => {
    const bundle = assembleCoachingBundle(
      buildAssemblyInput({
        storedData: buildStoredData({
          habitRecords: [
            buildHabitRecord('2026-09-01', 9000),
            buildHabitRecord('2026-08-30', 9000),
          ],
        }),
      }),
    );

    expect(bundle.habits.daysConsidered).toBe(9);
    expect(bundle.habits.goodDayCount).toBe(2);
  });

  it('stops at the day the programme started rather than inventing history', () => {
    const bundle = assembleCoachingBundle(
      buildAssemblyInput({
        storedData: buildStoredData({ assignment: buildAssignment({ startedOn: '2026-08-30' }) }),
      }),
    );

    expect(bundle.habits.daysConsidered).toBe(3);
  });

  it('honours the ceiling on how many days it looks at', () => {
    const bundle = assembleCoachingBundle(
      buildAssemblyInput({
        storedData: buildStoredData({ assignment: buildAssignment({ startedOn: '2026-01-01' }) }),
        maximumHabitDayCount: 10,
      }),
    );

    expect(bundle.habits.daysConsidered).toBe(10);
  });

  /*
   * The step target climbs from 5,000 to 9,000 across the twelve weeks, so a
   * day in week one is judged against a smaller number than a day in week ten.
   * Judging history against today's target is the bug this guards.
   */
  it('judges each day against the step target that was in force on it', () => {
    const bundle = assembleCoachingBundle(
      buildAssemblyInput({
        storedData: buildStoredData({
          assignment: buildAssignment({ startedOn: '2026-08-31' }),
          habitRecords: [buildHabitRecord('2026-08-31', 5000)],
        }),
      }),
    );

    const stepRow = bundle.habits.rows.find((row) => row.habitId === 'stepCount');

    expect(stepRow?.daysMet).toBe(1);
  });

  it('carries on without an assignment rather than refusing to export', () => {
    const bundle = assembleCoachingBundle(
      buildAssemblyInput({ storedData: buildStoredData({ assignment: null }) }),
    );

    expect(bundle.programme).toBeNull();
    expect(bundle.athlete.displayName).toBe('Omar');
  });
});

describe('the claim the two callers rest on', () => {
  /*
   * The download button in Settings and `npm run coach:export` read Firestore
   * with different libraries in different processes. Everything after the read
   * is this one function, so the same stored documents have to produce the same
   * bytes — otherwise "the two produce the same file" is only a comment.
   */
  it('turns the same stored documents into the same bytes', () => {
    const storedData = buildStoredData({
      habitRecords: [buildHabitRecord('2026-09-01', 9000)],
    });

    const oneCaller = formatCoachingBundleAsJson(
      assembleCoachingBundle(buildAssemblyInput({ storedData })),
    );

    const otherCaller = formatCoachingBundleAsJson(
      assembleCoachingBundle(buildAssemblyInput({ storedData })),
    );

    expect(oneCaller).toBe(otherCaller);
  });
});
