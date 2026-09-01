import { describeEquipment } from '@/content/equipment/gymEquipment';
import { muscleGroupLabels } from '@/content/vocabulary/trainingVocabularyLabels';
import type { EquipmentId, MuscleGroup } from '@/types/trainingVocabulary';

/**
 * The labels the exercise library uses.
 *
 * Presentation only, and no tone — Harout's copy lives in
 * `src/content/coachVoice/`. The library has no coach lines at all, and that is
 * deliberate: this screen is a reference, and a reference that comments on what
 * you looked up is a reference nobody looks things up in.
 */

/** "Chest, front delts and triceps" — a list a person would say out loud. */
export function describeMuscleGroups(muscleGroups: readonly MuscleGroup[]): string {
  const labels = muscleGroups.map((muscleGroup) => muscleGroupLabels[muscleGroup]);

  return joinWithAnd(labels);
}

/**
 * "Dumbbells and Adjustable bench", read off the equipment content.
 *
 * One id at a time is already `describeEquipment` in
 * `src/content/equipment/gymEquipment.ts`; this is the list version, which is
 * what an exercise actually has.
 */
export function describeRequiredEquipment(equipmentIds: readonly EquipmentId[]): string {
  return joinWithAnd(equipmentIds.map((equipmentId) => describeEquipment(equipmentId)));
}

/**
 * "34 movements", or "3 of 34" while something is being filtered.
 *
 * The total is always shown alongside the count, because "3 movements" on a
 * screen with a search box in it reads as a very small library rather than as a
 * narrow search.
 */
export function describeLibrarySize(matchingCount: number, totalCount: number): string {
  const movements = totalCount === 1 ? 'movement' : 'movements';

  return matchingCount === totalCount
    ? `${String(totalCount)} ${movements}`
    : `${String(matchingCount)} of ${String(totalCount)} ${movements}`;
}

/** "a, b and c". Empty string for an empty list, so a caller can test it. */
function joinWithAnd(labels: readonly string[]): string {
  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return labels[0] ?? '';
  }

  const allButLast = labels.slice(0, -1).join(', ');

  return `${allButLast} and ${labels[labels.length - 1] ?? ''}`;
}
