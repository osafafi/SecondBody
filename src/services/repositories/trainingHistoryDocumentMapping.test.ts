import { describe, expect, it } from 'vitest';

import {
  fromPersonalRecordDocument,
  fromProgramAssignmentDocument,
  fromWorkoutSessionDocument,
  toPersonalRecordDocumentFields,
  toProgramAssignmentDocumentFields,
  toWorkoutSessionDocumentFields,
} from './trainingHistoryDocumentMapping';

function buildFakeTimestamp(isoString: string) {
  return { toDate: () => new Date(isoString) };
}

function buildStoredAssignment(overrides: Record<string, unknown> = {}) {
  return {
    programTemplateId: 'twelveWeekFoundation',
    startedOn: '2026-09-01',
    currentPhaseNumber: 1,
    currentWeekNumber: 3,
    nextSessionLetter: 'B',
    status: 'active',
    completedOn: null,
    ...overrides,
  };
}

function buildStoredSession(overrides: Record<string, unknown> = {}) {
  return {
    programAssignmentId: 'assignment-1',
    sessionLetter: 'A',
    phaseNumber: 1,
    weekNumber: 3,
    startedAt: buildFakeTimestamp('2026-09-14T17:00:00.000Z'),
    completedAt: buildFakeTimestamp('2026-09-14T17:52:00.000Z'),
    status: 'completed',
    performedExercises: [
      {
        exerciseId: 'gobletSquat',
        orderIndex: 1,
        wasSkipped: false,
        skipReason: null,
        performedSets: [
          {
            setNumber: 1,
            prescribedWeightKilograms: 16,
            prescribedReps: 10,
            actualWeightKilograms: 16,
            actualReps: 10,
            effortRating: 'justRight',
            didCauseSharpPain: false,
            completedAt: buildFakeTimestamp('2026-09-14T17:08:00.000Z'),
            restSecondsTaken: 90,
          },
        ],
      },
    ],
    totalVolumeKilograms: 160,
    durationSeconds: 3120,
    sessionNotes: null,
    overallFeeling: 'normal',
    ...overrides,
  };
}

describe('reading a programme assignment', () => {
  it('reads every field back', () => {
    const assignment = fromProgramAssignmentDocument('assignment-1', buildStoredAssignment());

    expect(assignment).toEqual({
      programTemplateId: 'twelveWeekFoundation',
      startedOn: '2026-09-01',
      currentPhaseNumber: 1,
      currentWeekNumber: 3,
      nextSessionLetter: 'B',
      status: 'active',
      completedOn: null,
    });
  });

  /*
   * The strictness rule, and the counterpart to the leniency in
   * userAccountDocumentMapping. A status is small, closed and load-bearing: an
   * unrecognised one is a bug, not a degraded assignment, so it should be heard.
   */
  it('refuses a status it does not recognise', () => {
    expect(() =>
      fromProgramAssignmentDocument('assignment-1', buildStoredAssignment({ status: 'paused' })),
    ).toThrow(/active, completed, abandoned/);
  });

  it('refuses a session letter outside A, B and C', () => {
    expect(() =>
      fromProgramAssignmentDocument(
        'assignment-1',
        buildStoredAssignment({ nextSessionLetter: 'D' }),
      ),
    ).toThrow(/nextSessionLetter/);
  });

  it('refuses a start date that is not a real calendar day', () => {
    expect(() =>
      fromProgramAssignmentDocument(
        'assignment-1',
        buildStoredAssignment({ startedOn: '2026-02-31' }),
      ),
    ).toThrow(/startedOn/);
  });

  it('names the document in the error, so the bad one can be found', () => {
    expect(() =>
      fromProgramAssignmentDocument('assignment-7', buildStoredAssignment({ status: 'paused' })),
    ).toThrow(/programAssignments\/assignment-7/);
  });

  it('survives a round trip unchanged', () => {
    const original = fromProgramAssignmentDocument('assignment-1', buildStoredAssignment());

    expect(
      fromProgramAssignmentDocument('assignment-1', toProgramAssignmentDocumentFields(original)),
    ).toEqual(original);
  });
});

describe('reading a workout session', () => {
  it('reads the session, its exercises and its sets', () => {
    const session = fromWorkoutSessionDocument('session-1', buildStoredSession());

    expect(session.sessionLetter).toBe('A');
    expect(session.status).toBe('completed');
    expect(session.totalVolumeKilograms).toBe(160);
    expect(session.performedExercises).toHaveLength(1);
    expect(session.performedExercises[0]?.exerciseId).toBe('gobletSquat');
    expect(session.performedExercises[0]?.performedSets[0]?.actualReps).toBe(10);
  });

  it('turns every nested timestamp into a Date, not just the top-level ones', () => {
    const session = fromWorkoutSessionDocument('session-1', buildStoredSession());

    expect(session.startedAt).toBeInstanceOf(Date);
    expect(session.completedAt).toBeInstanceOf(Date);
    expect(session.performedExercises[0]?.performedSets[0]?.completedAt).toBeInstanceOf(Date);
    expect(session.performedExercises[0]?.performedSets[0]?.completedAt.toISOString()).toBe(
      '2026-09-14T17:08:00.000Z',
    );
  });

  it('reads a session still in progress, which has no completion time', () => {
    const session = fromWorkoutSessionDocument(
      'session-1',
      buildStoredSession({ status: 'inProgress', completedAt: null, durationSeconds: null }),
    );

    expect(session.status).toBe('inProgress');
    expect(session.completedAt).toBeNull();
    expect(session.durationSeconds).toBeNull();
  });

  /*
   * The reason PerformedSet departs from the shape sketched in DATA_MODEL.md. A
   * dead bug has no weight, and storing 0 would be a lie the volume chart then
   * averages in.
   */
  it('keeps a bodyweight set weightless rather than calling it zero', () => {
    const session = fromWorkoutSessionDocument(
      'session-1',
      buildStoredSession({
        performedExercises: [
          {
            exerciseId: 'deadBug',
            orderIndex: 1,
            wasSkipped: false,
            skipReason: null,
            performedSets: [
              {
                setNumber: 1,
                prescribedWeightKilograms: null,
                prescribedReps: 8,
                actualWeightKilograms: null,
                actualReps: 8,
                effortRating: 'justRight',
                didCauseSharpPain: false,
                completedAt: buildFakeTimestamp('2026-09-14T17:20:00.000Z'),
                restSecondsTaken: null,
              },
            ],
          },
        ],
      }),
    );

    const performedSet = session.performedExercises[0]?.performedSets[0];

    expect(performedSet?.actualWeightKilograms).toBeNull();
    expect(performedSet?.prescribedWeightKilograms).toBeNull();
    expect(performedSet?.restSecondsTaken).toBeNull();
  });

  it('reads a skipped exercise together with its reason', () => {
    const session = fromWorkoutSessionDocument(
      'session-1',
      buildStoredSession({
        performedExercises: [
          {
            exerciseId: 'latPulldown',
            orderIndex: 2,
            wasSkipped: true,
            skipReason: 'machine was taken',
            performedSets: [],
          },
        ],
      }),
    );

    expect(session.performedExercises[0]?.wasSkipped).toBe(true);
    expect(session.performedExercises[0]?.skipReason).toBe('machine was taken');
    expect(session.performedExercises[0]?.performedSets).toEqual([]);
  });

  it('points at the exercise and set number when a nested field is wrong', () => {
    const storedSession = buildStoredSession({
      performedExercises: [
        {
          exerciseId: 'gobletSquat',
          orderIndex: 1,
          wasSkipped: false,
          skipReason: null,
          performedSets: [
            {
              setNumber: 1,
              prescribedReps: 10,
              actualReps: 10,
              effortRating: 'somewhatSpicy',
              didCauseSharpPain: false,
              completedAt: buildFakeTimestamp('2026-09-14T17:08:00.000Z'),
            },
          ],
        },
      ],
    });

    expect(() => fromWorkoutSessionDocument('session-1', storedSession)).toThrow(
      /exercise 1 set 1/,
    );
  });

  it('survives a round trip unchanged', () => {
    const original = fromWorkoutSessionDocument('session-1', buildStoredSession());

    expect(
      fromWorkoutSessionDocument('session-1', toWorkoutSessionDocumentFields(original)),
    ).toEqual(original);
  });

  it('writes Dates back out, which Firestore converts to timestamps itself', () => {
    const original = fromWorkoutSessionDocument('session-1', buildStoredSession());
    const writtenFields = toWorkoutSessionDocumentFields(original);

    expect(writtenFields.startedAt).toBeInstanceOf(Date);
  });
});

describe('reading a personal record', () => {
  it('takes the exercise id from the document id, which is the source of truth', () => {
    const record = fromPersonalRecordDocument('gobletSquat', {
      exerciseId: 'staleValueFromAnOlderWrite',
      bestWeightKilograms: 24,
      bestRepsAtBestWeight: 10,
      estimatedOneRepMaxKilograms: 32,
      achievedOn: '2026-09-14',
      achievedInSessionId: 'session-1',
    });

    expect(record.exerciseId).toBe('gobletSquat');
    expect(record.bestWeightKilograms).toBe(24);
    expect(record.estimatedOneRepMaxKilograms).toBe(32);
  });

  it('survives a round trip unchanged', () => {
    const original = fromPersonalRecordDocument('gobletSquat', {
      exerciseId: 'gobletSquat',
      bestWeightKilograms: 24,
      bestRepsAtBestWeight: 10,
      estimatedOneRepMaxKilograms: 32,
      achievedOn: '2026-09-14',
      achievedInSessionId: 'session-1',
    });

    expect(
      fromPersonalRecordDocument('gobletSquat', toPersonalRecordDocumentFields(original)),
    ).toEqual(original);
  });
});
