import type { ExercisePerformanceHistory } from '@/types/performanceTypes';
import type { WorkoutSession } from '@/types/trainingHistoryTypes';
import type { RepRange } from '@/types/trainingVocabulary';

/**
 * Reading past sessions back into the shape progression wants.
 *
 * `resolveSessionPlan` asks for one `ExercisePerformanceHistory` per exercise —
 * the last prescription and the sets performed against it. Firestore stores
 * whole sessions instead, so something has to turn a list of sessions into that
 * map. Getting it wrong means the app either never progresses or progresses on
 * evidence that is not there, so it is here, with tests, rather than inline in
 * a component.
 *
 * Two rules that are not obvious and are both deliberate:
 *
 * 1. **Only completed sessions count.** An abandoned session may hold one set
 *    of an exercise that was prescribed two, and "every set reached the top of
 *    the range" would then be true of a session he walked out of. Progression
 *    is allowed to be slow; it is not allowed to be wrong.
 * 2. **A skipped exercise does not erase its history.** The machine being busy
 *    last Wednesday is not a reason to prescribe a calibration weight today, so
 *    the search keeps going back until it finds a session where the exercise was
 *    actually performed.
 */

export type ExercisePerformanceHistoryInput = {
  /** Most recent first, as `readRecentWorkoutSessions` returns them. */
  recentSessions: readonly WorkoutSession[];

  /**
   * The rep range today's programme writes for an exercise, or null for
   * movements that are not counted in reps at all.
   *
   * It is needed because a stored set records `prescribedReps` — one number,
   * the top of the range — and the range's width has to come from somewhere to
   * rebuild the bottom of it. The width never changes: bodyweight progression
   * shifts both ends of the range together.
   */
  resolveCurrentRepRangeForExercise: (exerciseId: string) => RepRange | null;
};

/**
 * Rebuilds the range that was in force, from the one number a set stores.
 *
 * Carries and cardio have no rep range and never reach the rep-range rules —
 * `sessionPlanning` sends them to `calculateNextPrescribedCarryWeight`, which
 * reads effort only, or plans them with no history at all. They get a degenerate
 * range rather than a guessed width, because a guessed width would look like a
 * fact.
 */
function rebuildPrescribedRepRange(
  prescribedReps: number,
  currentRepRange: RepRange | null,
): RepRange {
  if (!currentRepRange) {
    return { minimumReps: prescribedReps, maximumReps: prescribedReps };
  }

  const rangeWidth = currentRepRange.maximumReps - currentRepRange.minimumReps;

  return {
    minimumReps: Math.max(1, prescribedReps - rangeWidth),
    maximumReps: prescribedReps,
  };
}

/**
 * The last time each exercise was actually trained, keyed by exercise id.
 *
 * An exercise that has never been performed is simply absent, which is what
 * `resolveSessionPlan` reads as "prescribe the starting weight and ask him to
 * find his line".
 */
export function buildExercisePerformanceHistories(
  input: ExercisePerformanceHistoryInput,
): Record<string, ExercisePerformanceHistory> {
  const historiesByExerciseId: Record<string, ExercisePerformanceHistory> = {};

  const completedSessions = input.recentSessions.filter(
    (session) => session.status === 'completed',
  );

  for (const session of completedSessions) {
    for (const performedExercise of session.performedExercises) {
      if (performedExercise.wasSkipped || performedExercise.performedSets.length === 0) {
        continue;
      }

      // Sessions arrive newest first, so the first one seen is the latest one.
      if (historiesByExerciseId[performedExercise.exerciseId]) {
        continue;
      }

      const firstPerformedSet = performedExercise.performedSets[0];

      if (!firstPerformedSet) {
        continue;
      }

      historiesByExerciseId[performedExercise.exerciseId] = {
        exerciseId: performedExercise.exerciseId,
        /*
         * What the app asked for, not the heaviest set performed, so that going
         * off-script for one set does not silently become the new baseline.
         */
        lastPrescribedWeightKilograms: firstPerformedSet.prescribedWeightKilograms,
        lastPrescribedRepRange: rebuildPrescribedRepRange(
          firstPerformedSet.prescribedReps,
          input.resolveCurrentRepRangeForExercise(performedExercise.exerciseId),
        ),
        lastPerformedSets: performedExercise.performedSets,
      };
    }
  }

  return historiesByExerciseId;
}

/**
 * When the last completed session finished, for the layoff rules.
 *
 * Null when nothing has ever been completed, which
 * `determineLayoffAdjustment` reads as a new user rather than as somebody who
 * has been away forever.
 */
export function findLastCompletedSessionAt(recentSessions: readonly WorkoutSession[]): Date | null {
  const completedAtInstants = recentSessions
    .filter((session) => session.status === 'completed')
    .map((session) => session.completedAt)
    .filter((completedAt): completedAt is Date => completedAt !== null);

  if (completedAtInstants.length === 0) {
    return null;
  }

  return completedAtInstants.reduce((latest, candidate) =>
    candidate.getTime() > latest.getTime() ? candidate : latest,
  );
}

/** How many sessions have been completed, for the coach's praise rationing. */
export function countCompletedSessions(recentSessions: readonly WorkoutSession[]): number {
  return recentSessions.filter((session) => session.status === 'completed').length;
}
