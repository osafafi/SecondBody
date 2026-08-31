import type { PlannedExercise, PlannedSession } from '@/domain/sessionPlanning';
import type { ExercisePerformanceHistory, PerformedSetRecord } from '@/types/performanceTypes';
import type { PerformedExercise, PerformedSet, WorkoutSession } from '@/types/trainingHistoryTypes';
import type { EffortRating, RepRange } from '@/types/trainingVocabulary';

/**
 * Builders for the shapes the domain tests need.
 *
 * Progression tests are about one or two fields at a time — "what happens when a
 * set was brutal" — and spelling out a whole `PerformedSetRecord` for each one
 * buries the interesting field in six uninteresting ones. These let a test name
 * only what it is actually testing.
 */

export function buildPerformedSet(overrides: Partial<PerformedSetRecord> = {}): PerformedSetRecord {
  return {
    setNumber: 1,
    prescribedWeightKilograms: 40,
    actualWeightKilograms: 40,
    actualReps: 10,
    effortRating: 'justRight',
    didCauseSharpPain: false,
    ...overrides,
  };
}

/**
 * A run of identical sets, numbered in order.
 *
 * Most progression rules care about "every set" or "any set", so the common
 * setup is several sets that agree with each other and at most one that does not.
 */
export function buildPerformedSets(
  setCount: number,
  overrides: Partial<PerformedSetRecord> = {},
): PerformedSetRecord[] {
  return Array.from({ length: setCount }, (_unused, index) =>
    buildPerformedSet({ setNumber: index + 1, ...overrides }),
  );
}

/** Several sets that all reached the given rep count at the given effort. */
export function buildSetsAtReps(
  setCount: number,
  actualReps: number,
  effortRating: EffortRating = 'justRight',
): PerformedSetRecord[] {
  return buildPerformedSets(setCount, { actualReps, effortRating });
}

export function buildPerformanceHistory(
  overrides: Partial<ExercisePerformanceHistory> = {},
): ExercisePerformanceHistory {
  const defaultRepRange: RepRange = { minimumReps: 10, maximumReps: 12 };

  return {
    exerciseId: 'legExtension',
    lastPrescribedWeightKilograms: 30,
    lastPrescribedRepRange: defaultRepRange,
    lastPerformedSets: buildSetsAtReps(2, 11),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// The session player's shapes
// ---------------------------------------------------------------------------

/**
 * A two-set weighted exercise, which is what most of the programme looks like.
 *
 * The machine tests are about transitions rather than about content, so a
 * hand-built plan says what a test is exercising far more directly than one
 * resolved from the real programme — the set count is right there in the test.
 */
export function buildPlannedExercise(overrides: Partial<PlannedExercise> = {}): PlannedExercise {
  return {
    orderIndex: 1,
    exerciseId: 'legExtension',
    slotNote: null,
    restSecondsBetweenSets: 90,
    workingSetCount: 2,
    isFlaggedForPain: false,
    prescription: {
      kind: 'weightAndReps',
      repRange: { minimumReps: 10, maximumReps: 12 },
      isPerSide: false,
      prescribedWeightKilograms: 30,
      loadDecisionReason: 'held',
      changeFromPreviousKilograms: 0,
      wasEveryPreviousSetEasy: false,
    },
    ...overrides,
  };
}

export function buildPlannedSession(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return {
    sessionLetter: 'A',
    displayName: 'Legs & Pull',
    summary: 'The squat you are here to learn.',
    phaseNumber: 1,
    phaseDisplayName: 'Groove the patterns',
    weekNumber: 2,
    workingSetCount: 2,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: null,
    targetEffortRange: {
      minimumRatingOfPerceivedExertion: 5,
      maximumRatingOfPerceivedExertion: 6,
    },
    warmup: {
      warmupRoutineId: 'testWarmup',
      displayName: 'Warm-up',
      isMorningVersion: false,
      steps: [],
      estimatedDurationSeconds: 300,
    },
    rampSet: null,
    exercises: [buildPlannedExercise()],
    ...overrides,
  };
}

/** One stored set, as it appears inside a session document. */
export function buildLoggedSet(overrides: Partial<PerformedSet> = {}): PerformedSet {
  return {
    setNumber: 1,
    prescribedWeightKilograms: 30,
    prescribedReps: 12,
    actualWeightKilograms: 30,
    actualReps: 12,
    effortRating: 'justRight',
    didCauseSharpPain: false,
    completedAt: new Date('2026-08-31T18:00:00.000Z'),
    restSecondsTaken: 90,
    ...overrides,
  };
}

export function buildLoggedExercise(overrides: Partial<PerformedExercise> = {}): PerformedExercise {
  return {
    exerciseId: 'legExtension',
    orderIndex: 1,
    performedSets: [buildLoggedSet()],
    wasSkipped: false,
    skipReason: null,
    ...overrides,
  };
}

export function buildWorkoutSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    programAssignmentId: 'assignment-1',
    sessionLetter: 'A',
    phaseNumber: 1,
    weekNumber: 1,
    startedAt: new Date('2026-08-31T17:00:00.000Z'),
    completedAt: new Date('2026-08-31T18:00:00.000Z'),
    status: 'completed',
    performedExercises: [buildLoggedExercise()],
    totalVolumeKilograms: 360,
    durationSeconds: 3600,
    sessionNotes: null,
    overallFeeling: null,
    ...overrides,
  };
}
