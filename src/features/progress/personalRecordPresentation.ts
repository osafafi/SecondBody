import { findExerciseById } from '@/content/exercises/allExercises';
import type { PersonalRecord } from '@/types/trainingHistoryTypes';

import type { NamedPersonalRecord } from './components/PersonalRecordsPanel';

/**
 * Records, with their exercises resolved to names and put in an order.
 *
 * Not `src/domain/`, because it reads `src/content/` — the dependency rule in
 * CLAUDE.md section 3 runs the other way. Not inside the panel either: the
 * ordering rule and the dropping rule are decisions worth a test, and a
 * component that has to be rendered to check its sort order is a component that
 * never gets checked.
 */

/**
 * Heaviest estimated one-rep max first.
 *
 * Ranked on the estimate rather than on the weight, because "60 kg for 8" is a
 * better lift than "65 kg for 3" and a list sorted by the number on the bar
 * would put them the wrong way round. See `estimatedOneRepMax.ts`.
 *
 * A record whose exercise is no longer in the content layer is dropped. That
 * only happens when an exercise is removed from `src/content/exercises/` after
 * being trained, which is a content bug — and a row reading "legPress45" is not
 * the way to report one.
 */
export function resolveNamedPersonalRecords(
  personalRecords: readonly PersonalRecord[],
): NamedPersonalRecord[] {
  return personalRecords
    .flatMap((record) => {
      const exercise = findExerciseById(record.exerciseId);

      if (!exercise) {
        return [];
      }

      return [
        {
          exerciseId: record.exerciseId,
          exerciseDisplayName: exercise.displayName,
          bestWeightKilograms: record.bestWeightKilograms,
          bestRepsAtBestWeight: record.bestRepsAtBestWeight,
          estimatedOneRepMaxKilograms: record.estimatedOneRepMaxKilograms,
          achievedOn: record.achievedOn,
        },
      ];
    })
    .sort(
      (heavier, lighter) =>
        lighter.estimatedOneRepMaxKilograms - heavier.estimatedOneRepMaxKilograms,
    );
}
