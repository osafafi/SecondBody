import { describe, expect, it } from 'vitest';

import {
  buildLoggedExercise,
  buildLoggedSet,
  buildPlannedExercise,
  buildPlannedSession,
} from '@/test/trainingTestFactories';
import type { LoadingStyle } from '@/types/trainingVocabulary';

import {
  buildPerformedSetFromDraft,
  buildWorkoutSessionRecord,
  countLoggedSets,
  countPlannedSets,
  createSetLogDraft,
  resolveSetCountStep,
  resolveSetCountUnit,
  summariseLoggedSession,
} from './sessionLogging';

const STARTED_AT = new Date('2026-09-02T09:00:00.000Z');
const FINISHED_AT = new Date('2026-09-02T09:52:30.000Z');

const alwaysWeightStack = (): LoadingStyle => 'weightStackMachine';

describe('resolveSetCountUnit', () => {
  it('counts reps for a weighted movement', () => {
    expect(
      resolveSetCountUnit({
        kind: 'weightAndReps',
        repRange: { minimumReps: 10, maximumReps: 12 },
        isPerSide: false,
        prescribedWeightKilograms: 30,
        loadDecisionReason: 'held',
        changeFromPreviousKilograms: 0,
        wasEveryPreviousSetEasy: false,
      }),
    ).toBe('reps');
  });

  it('says so when the reps are per side, because eight is not sixteen', () => {
    expect(
      resolveSetCountUnit({
        kind: 'bodyweightReps',
        repRange: { minimumReps: 6, maximumReps: 8 },
        isPerSide: true,
        repRangeDecisionReason: 'held',
      }),
    ).toBe('repsPerSide');
  });

  it('counts metres for a carry and minutes for cardio', () => {
    expect(
      resolveSetCountUnit({
        kind: 'loadedCarry',
        distanceMetresPerSet: 30,
        prescribedWeightKilograms: 12,
        loadDecisionReason: 'held',
        changeFromPreviousKilograms: 0,
        wasEveryPreviousSetEasy: false,
      }),
    ).toBe('metres');

    expect(
      resolveSetCountUnit({
        kind: 'steadyStateCardio',
        durationMinutes: 10,
        machineSettingsNote: '5% incline, 5 km/h',
      }),
    ).toBe('minutes');
  });
});

describe('resolveSetCountStep', () => {
  it('moves metres in fives and everything else one at a time', () => {
    expect(resolveSetCountStep('metres')).toBe(5);
    expect(resolveSetCountStep('reps')).toBe(1);
    expect(resolveSetCountStep('minutes')).toBe(1);
  });
});

describe('createSetLogDraft', () => {
  it('prefills a weighted set with exactly what was prescribed', () => {
    const draft = createSetLogDraft(buildPlannedExercise(), 2);

    expect(draft).toEqual({
      setNumber: 2,
      prescribedWeightKilograms: 30,
      prescribedReps: 12,
      actualWeightKilograms: 30,
      actualReps: 12,
      effortRating: 'justRight',
      didCauseSharpPain: false,
    });
  });

  it('targets the top of the rep range, which is what progression climbs to', () => {
    const draft = createSetLogDraft(
      buildPlannedExercise({
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: false,
          prescribedWeightKilograms: 20,
          loadDecisionReason: 'held',
          changeFromPreviousKilograms: 0,
          wasEveryPreviousSetEasy: false,
        },
      }),
      1,
    );

    expect(draft.prescribedReps).toBe(10);
  });

  it('leaves a bodyweight movement with no weight rather than a zero', () => {
    const draft = createSetLogDraft(
      buildPlannedExercise({
        prescription: {
          kind: 'bodyweightReps',
          repRange: { minimumReps: 6, maximumReps: 8 },
          isPerSide: true,
          repRangeDecisionReason: 'held',
        },
      }),
      1,
    );

    expect(draft.prescribedWeightKilograms).toBeNull();
    expect(draft.actualWeightKilograms).toBeNull();
    expect(draft.actualReps).toBe(8);
  });

  it('counts a carry in metres and keeps the weight of one implement', () => {
    const draft = createSetLogDraft(
      buildPlannedExercise({
        prescription: {
          kind: 'loadedCarry',
          distanceMetresPerSet: 30,
          prescribedWeightKilograms: 12,
          loadDecisionReason: 'held',
          changeFromPreviousKilograms: 0,
          wasEveryPreviousSetEasy: false,
        },
      }),
      1,
    );

    expect(draft.actualReps).toBe(30);
    expect(draft.actualWeightKilograms).toBe(12);
  });

  it('counts cardio in minutes and carries no weight', () => {
    const draft = createSetLogDraft(
      buildPlannedExercise({
        prescription: {
          kind: 'steadyStateCardio',
          durationMinutes: 10,
          machineSettingsNote: '5% incline, 5 km/h',
        },
      }),
      1,
    );

    expect(draft.actualReps).toBe(10);
    expect(draft.prescribedWeightKilograms).toBeNull();
  });
});

describe('buildPerformedSetFromDraft', () => {
  it('adds the two facts only the app knows', () => {
    const performedSet = buildPerformedSetFromDraft(
      createSetLogDraft(buildPlannedExercise(), 1),
      FINISHED_AT,
      95,
    );

    expect(performedSet.completedAt).toEqual(FINISHED_AT);
    expect(performedSet.restSecondsTaken).toBe(95);
  });

  it('keeps "no rest measured" distinct from "no rest taken"', () => {
    const performedSet = buildPerformedSetFromDraft(
      createSetLogDraft(buildPlannedExercise(), 1),
      FINISHED_AT,
      null,
    );

    expect(performedSet.restSecondsTaken).toBeNull();
  });
});

describe('counting sets', () => {
  it('adds up what the session asks for', () => {
    const plannedSession = buildPlannedSession({
      exercises: [
        buildPlannedExercise({ workingSetCount: 2 }),
        buildPlannedExercise({ exerciseId: 'seatedCableRow', workingSetCount: 3 }),
      ],
    });

    expect(countPlannedSets(plannedSession)).toBe(5);
  });

  it('adds up what was actually logged', () => {
    expect(
      countLoggedSets([
        buildLoggedExercise({ performedSets: [buildLoggedSet(), buildLoggedSet()] }),
        buildLoggedExercise({ exerciseId: 'seatedCableRow', performedSets: [buildLoggedSet()] }),
      ]),
    ).toBe(3);
  });
});

describe('summariseLoggedSession', () => {
  const plannedSession = buildPlannedSession({
    exercises: [
      buildPlannedExercise({ exerciseId: 'legExtension', workingSetCount: 2 }),
      buildPlannedExercise({ exerciseId: 'seatedCableRow', workingSetCount: 2 }),
    ],
  });

  it('counts sets, exercises and skips separately', () => {
    const summary = summariseLoggedSession({
      plannedSession,
      loggedExercises: [
        buildLoggedExercise({
          exerciseId: 'legExtension',
          performedSets: [buildLoggedSet(), buildLoggedSet({ setNumber: 2 })],
        }),
        buildLoggedExercise({
          exerciseId: 'seatedCableRow',
          performedSets: [],
          wasSkipped: true,
          skipReason: 'Someone was on it',
        }),
      ],
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      resolveLoadingStyleForExercise: alwaysWeightStack,
    });

    expect(summary.loggedSetCount).toBe(2);
    expect(summary.plannedSetCount).toBe(4);
    expect(summary.performedExerciseCount).toBe(1);
    expect(summary.skippedExerciseCount).toBe(1);
  });

  it('totals the volume through the loading style the caller resolves', () => {
    const summary = summariseLoggedSession({
      plannedSession,
      loggedExercises: [
        buildLoggedExercise({
          exerciseId: 'legExtension',
          performedSets: [buildLoggedSet({ actualWeightKilograms: 30, actualReps: 12 })],
        }),
      ],
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      resolveLoadingStyleForExercise: alwaysWeightStack,
    });

    expect(summary.totalVolumeKilograms).toBe(360);
  });

  it('counts both dumbbells when the plan says the reps are per side', () => {
    const perSidePlan = buildPlannedSession({
      exercises: [
        buildPlannedExercise({
          exerciseId: 'splitSquat',
          prescription: {
            kind: 'weightAndReps',
            repRange: { minimumReps: 6, maximumReps: 8 },
            isPerSide: true,
            prescribedWeightKilograms: 8,
            loadDecisionReason: 'held',
            changeFromPreviousKilograms: 0,
            wasEveryPreviousSetEasy: false,
          },
        }),
      ],
    });

    const summary = summariseLoggedSession({
      plannedSession: perSidePlan,
      loggedExercises: [
        buildLoggedExercise({
          exerciseId: 'splitSquat',
          performedSets: [buildLoggedSet({ actualWeightKilograms: 8, actualReps: 8 })],
        }),
      ],
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      resolveLoadingStyleForExercise: (): LoadingStyle => 'dumbbellPair',
    });

    // Two dumbbells of 8 kg, eight reps on each side: 8 x 2 x 8 x 2.
    expect(summary.totalVolumeKilograms).toBe(256);
  });

  it('measures how long the session took', () => {
    const summary = summariseLoggedSession({
      plannedSession,
      loggedExercises: [],
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      resolveLoadingStyleForExercise: alwaysWeightStack,
    });

    expect(summary.durationSeconds).toBe(3150);
  });

  it('flags a session where something hurt', () => {
    const summary = summariseLoggedSession({
      plannedSession,
      loggedExercises: [
        buildLoggedExercise({
          performedSets: [buildLoggedSet({ didCauseSharpPain: true })],
        }),
      ],
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      resolveLoadingStyleForExercise: alwaysWeightStack,
    });

    expect(summary.didAnySetCauseSharpPain).toBe(true);
  });

  it('ignores a logged exercise the plan does not contain, having no way to weigh it', () => {
    const summary = summariseLoggedSession({
      plannedSession,
      loggedExercises: [
        buildLoggedExercise({
          exerciseId: 'anExerciseFromAnotherProgramme',
          performedSets: [buildLoggedSet({ actualWeightKilograms: 100, actualReps: 10 })],
        }),
      ],
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      resolveLoadingStyleForExercise: alwaysWeightStack,
    });

    expect(summary.totalVolumeKilograms).toBe(0);
  });
});

describe('buildWorkoutSessionRecord', () => {
  const plannedSession = buildPlannedSession({ weekNumber: 3, phaseNumber: 1, sessionLetter: 'B' });

  const buildRecord = (status: 'inProgress' | 'completed') =>
    buildWorkoutSessionRecord({
      programAssignmentId: 'assignment-1',
      plannedSession,
      loggedExercises: [
        buildLoggedExercise({
          performedSets: [buildLoggedSet({ actualWeightKilograms: 30, actualReps: 12 })],
        }),
      ],
      startedAt: STARTED_AT,
      finishedAt: FINISHED_AT,
      resolveLoadingStyleForExercise: alwaysWeightStack,
      status,
      overallFeeling: 'normal',
      sessionNotes: 'Knee was quiet',
    });

  it('stamps the session with where in the programme it sits', () => {
    const record = buildRecord('completed');

    expect(record.programAssignmentId).toBe('assignment-1');
    expect(record.sessionLetter).toBe('B');
    expect(record.phaseNumber).toBe(1);
    expect(record.weekNumber).toBe(3);
  });

  it('denormalises the volume the charts will read', () => {
    expect(buildRecord('completed').totalVolumeKilograms).toBe(360);
  });

  it('leaves an in-progress session with no end and no duration', () => {
    const record = buildRecord('inProgress');

    expect(record.completedAt).toBeNull();
    expect(record.durationSeconds).toBeNull();
    expect(record.status).toBe('inProgress');
  });

  it('closes a finished session off', () => {
    const record = buildRecord('completed');

    expect(record.completedAt).toEqual(FINISHED_AT);
    expect(record.durationSeconds).toBe(3150);
    expect(record.overallFeeling).toBe('normal');
    expect(record.sessionNotes).toBe('Knee was quiet');
  });
});
