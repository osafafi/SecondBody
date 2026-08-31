import type { PerformedSetRecord } from '@/types/performanceTypes';
import type { PersonalRecord } from '@/types/trainingHistoryTypes';

import { calculateEstimatedOneRepMaxKilograms, isNewPersonalRecord } from './estimatedOneRepMax';

/**
 * Deciding what, in a finished session, was the best it has ever been.
 *
 * `estimatedOneRepMax.ts` compares two sets. This walks a whole session and
 * works out which stored records that session replaces — which is the part
 * `personalRecordsRepository` deliberately refused to do, because a repository
 * that quietly declined a write would hide a bug in this comparison rather than
 * surface it.
 *
 * Two exclusions matter, and both are here rather than at the call site:
 *
 * - **Only loaded rep work can hold a record.** A farmer's carry stores metres
 *   in `actualReps` and a treadmill walk stores minutes. Running either through
 *   Epley produces a confident, meaningless number. The caller says which
 *   exercises are eligible, because it is `src/content/` that knows how an
 *   exercise is prescribed and this layer may not read it.
 * - **A set that caused sharp pain never becomes a record.** It happened, it is
 *   stored on the session, and it is not a target to beat next month.
 */

/** One exercise's contribution to a session, as this module needs it. */
export type PersonalRecordCandidateExercise = {
  exerciseId: string;
  performedSets: readonly PerformedSetRecord[];
  wasSkipped: boolean;
};

export type PersonalRecordUpdate = {
  /** The record to store, ready for `writePersonalRecord`. */
  record: PersonalRecord;

  /** What it beat, or null the first time an exercise is ever trained. */
  previousEstimatedOneRepMaxKilograms: number | null;
};

export type PersonalRecordUpdateInput = {
  performedExercises: readonly PersonalRecordCandidateExercise[];

  /** Every record already stored, in any order. */
  existingRecords: readonly PersonalRecord[];

  /** Exercises whose sets are weight-and-reps. Anything else cannot hold a record. */
  exerciseIdsEligibleForRecords: readonly string[];

  /** ISO `YYYY-MM-DD` the session finished on. */
  achievedOn: string;

  achievedInSessionId: string;
};

/** A set that could hold a record: loaded, completed, and not painful. */
function canSetHoldARecord(performedSet: PerformedSetRecord): boolean {
  return (
    performedSet.actualWeightKilograms !== null &&
    performedSet.actualWeightKilograms > 0 &&
    performedSet.actualReps > 0 &&
    !performedSet.didCauseSharpPain
  );
}

/**
 * The best set of an exercise, by estimated one-rep max.
 *
 * Ties go to the earlier set, which is the one that was performed fresher. It
 * makes no difference to the stored number and it makes the function
 * deterministic, which matters more.
 */
export function findBestSetForRecord(
  performedSets: readonly PerformedSetRecord[],
): PerformedSetRecord | null {
  return performedSets
    .filter(canSetHoldARecord)
    .reduce<PerformedSetRecord | null>((best, performedSet) => {
      if (best === null) {
        return performedSet;
      }

      const bestEstimate = calculateEstimatedOneRepMaxKilograms(
        best.actualWeightKilograms ?? 0,
        best.actualReps,
      );
      const candidateEstimate = calculateEstimatedOneRepMaxKilograms(
        performedSet.actualWeightKilograms ?? 0,
        performedSet.actualReps,
      );

      return candidateEstimate > bestEstimate ? performedSet : best;
    }, null);
}

/**
 * Every record this session beat, and by how much.
 *
 * Returns an empty array on an ordinary session, which is the common case and
 * the correct one: most sessions do not set a record, and a screen that
 * celebrated every one of them would stop meaning anything.
 */
export function findPersonalRecordUpdates(
  input: PersonalRecordUpdateInput,
): PersonalRecordUpdate[] {
  const eligibleExerciseIds = new Set(input.exerciseIdsEligibleForRecords);

  const existingRecordsByExerciseId = new Map(
    input.existingRecords.map((record) => [record.exerciseId, record]),
  );

  return input.performedExercises.flatMap((performedExercise) => {
    if (performedExercise.wasSkipped || !eligibleExerciseIds.has(performedExercise.exerciseId)) {
      return [];
    }

    const bestSet = findBestSetForRecord(performedExercise.performedSets);

    if (!bestSet || bestSet.actualWeightKilograms === null) {
      return [];
    }

    const existingRecord = existingRecordsByExerciseId.get(performedExercise.exerciseId) ?? null;

    const beatsExistingRecord = isNewPersonalRecord(
      bestSet.actualWeightKilograms,
      bestSet.actualReps,
      existingRecord?.estimatedOneRepMaxKilograms ?? 0,
    );

    if (!beatsExistingRecord) {
      return [];
    }

    return [
      {
        record: {
          exerciseId: performedExercise.exerciseId,
          bestWeightKilograms: bestSet.actualWeightKilograms,
          bestRepsAtBestWeight: bestSet.actualReps,
          estimatedOneRepMaxKilograms: calculateEstimatedOneRepMaxKilograms(
            bestSet.actualWeightKilograms,
            bestSet.actualReps,
          ),
          achievedOn: input.achievedOn,
          achievedInSessionId: input.achievedInSessionId,
        },
        previousEstimatedOneRepMaxKilograms: existingRecord?.estimatedOneRepMaxKilograms ?? null,
      },
    ];
  });
}
