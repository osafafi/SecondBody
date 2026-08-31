import type { EffortRating, RepRange } from './trainingVocabulary';

/**
 * What actually happened on one set.
 *
 * This is the domain's view of a logged set, and it is deliberately narrower
 * than the Firestore document in docs/DATA_MODEL.md: no timestamps, no ids, no
 * rest duration. Progression does not need them, and leaving them out keeps
 * `src/domain/` free of anything Firebase-shaped. The repositories added in M4
 * map one to the other.
 */
export type PerformedSetRecord = {
  /** 1-based within the exercise. */
  setNumber: number;

  /** What the app asked for. Null for bodyweight and unloaded movements. */
  prescribedWeightKilograms: number | null;

  /** What was actually lifted. Null for bodyweight and unloaded movements. */
  actualWeightKilograms: number | null;

  /** Reps completed. For per-side movements this is reps per side, not the total. */
  actualReps: number;

  effortRating: EffortRating;

  /**
   * Sharp or joint pain, as distinct from muscle burn. This is a safety signal,
   * not an effort signal, and it outranks every other input to progression.
   */
  didCauseSharpPain: boolean;
};

/**
 * Everything progression needs to know about the last time an exercise was
 * trained. One of these per exercise, not per session.
 */
export type ExercisePerformanceHistory = {
  exerciseId: string;

  /**
   * The load the app prescribed last time, before any of it was performed. This
   * rather than the heaviest set performed, so that going off-script for one set
   * does not silently become the new baseline.
   * Null for bodyweight and unloaded movements.
   */
  lastPrescribedWeightKilograms: number | null;

  /** The rep range that was in force last time. */
  lastPrescribedRepRange: RepRange;

  /** Every working set performed, in order. Ramp sets are not included. */
  lastPerformedSets: PerformedSetRecord[];
};

/** A completed exercise within a session, as the volume calculation sees it. */
export type PerformedExerciseRecord = {
  exerciseId: string;
  performedSets: PerformedSetRecord[];
  wasSkipped: boolean;
};
