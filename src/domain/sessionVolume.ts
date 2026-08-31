import type { PerformedSetRecord } from '@/types/performanceTypes';
import type { LoadingStyle } from '@/types/trainingVocabulary';

import { calculateEffectiveLoadKilograms } from './loadIncrements';

/**
 * Total volume: weight times reps, summed.
 *
 * It is the number the progress charts trend, and it is the honest answer to
 * "did I do more this month than last month" in a way that neither bodyweight
 * nor a single top set can give.
 *
 * Two things make it less trivial than it sounds, and both are handled here
 * rather than at the call site where they would get forgotten:
 *
 * - **A pair of dumbbells is two dumbbells.** An 8 kg press is 16 kg of work.
 * - **Per-side reps are half the reps.** "8 per side" is 16 reps of work.
 */

/**
 * One exercise's contribution, with the two facts the raw set records do not
 * carry. The caller resolves these from `src/content/exercises/`; the domain
 * layer never reads content itself.
 */
export type ExerciseVolumeInput = {
  loadingStyle: LoadingStyle;

  /** True when the logged reps are per side rather than the total for the set. */
  isPerSide: boolean;

  performedSets: PerformedSetRecord[];
};

/** Volume for a single set. Unloaded and bodyweight movements contribute nothing. */
function calculateSetVolumeKilograms(
  performedSet: PerformedSetRecord,
  loadingStyle: LoadingStyle,
  isPerSide: boolean,
): number {
  if (performedSet.actualWeightKilograms === null || performedSet.actualWeightKilograms <= 0) {
    return 0;
  }

  const effectiveLoadKilograms = calculateEffectiveLoadKilograms(
    performedSet.actualWeightKilograms,
    loadingStyle,
  );
  const totalReps = isPerSide ? performedSet.actualReps * 2 : performedSet.actualReps;

  return effectiveLoadKilograms * totalReps;
}

/** Total volume for one exercise across all of its sets. */
export function calculateExerciseVolumeKilograms(exercise: ExerciseVolumeInput): number {
  const total = exercise.performedSets.reduce(
    (runningTotal, performedSet) =>
      runningTotal +
      calculateSetVolumeKilograms(performedSet, exercise.loadingStyle, exercise.isPerSide),
    0,
  );

  return Math.round(total * 10) / 10;
}

/**
 * Total volume for a whole session.
 *
 * Bodyweight and cardio contribute zero, which is correct: this measures load
 * moved, and it is only ever compared against other sessions of the same
 * programme, where the bodyweight work is the same either way.
 */
export function calculateSessionVolumeKilograms(exercises: ExerciseVolumeInput[]): number {
  const total = exercises.reduce(
    (runningTotal, exercise) => runningTotal + calculateExerciseVolumeKilograms(exercise),
    0,
  );

  return Math.round(total * 10) / 10;
}
