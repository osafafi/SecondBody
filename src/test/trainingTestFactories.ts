import type { ExercisePerformanceHistory, PerformedSetRecord } from '@/types/performanceTypes';
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
    exerciseId: 'legPress',
    lastPrescribedWeightKilograms: 40,
    lastPrescribedRepRange: defaultRepRange,
    lastPerformedSets: buildSetsAtReps(2, 11),
    ...overrides,
  };
}
