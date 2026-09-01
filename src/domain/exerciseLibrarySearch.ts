import type { ExerciseDefinition } from '@/types/exerciseTypes';
import type { MovementCategory } from '@/types/trainingVocabulary';

/**
 * Finding an exercise in the library.
 *
 * Here rather than inside the screen because the matching rules are the whole
 * behaviour — a filter that quietly fails to find "lat pulldown" is a library
 * that looks empty — and because they are exactly the kind of thing that is
 * easy to test and awkward to check by hand against three dozen exercises.
 *
 * **Everything is normalised down to letters and digits before it is compared.**
 * Ids are camelCase by contract, muscle groups are camelCase, and a person types
 * with spaces. Stripping everything else from both sides is what makes "lat
 * pulldown" find `latPulldownMachine` and "front delts" find `frontDeltoids`,
 * without a table of synonyms nobody would maintain.
 *
 * The haystack is built from the exercise's own fields rather than from display
 * labels, which keeps this layer free of `src/content/` the way the dependency
 * rule in CLAUDE.md section 3 asks. It costs one thing, and it is worth saying
 * out loud: a search for a word that only appears in a *label* — "quads", where
 * the id is `quadriceps` — matches by prefix rather than exactly, which is why
 * the comparison is a substring test in both directions rather than equality.
 */

/** Everything except letters and digits, folded away. */
function normaliseForSearch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Every word of an exercise worth matching against, as one normalised string.
 *
 * Form cues and common mistakes are deliberately **not** in here. They are
 * paragraphs, and including them turns a search for "shoulder" into a search
 * that returns most of the library because most cues mention a shoulder.
 */
function buildSearchHaystack(exercise: ExerciseDefinition): string {
  return normaliseForSearch(
    [
      exercise.exerciseId,
      exercise.displayName,
      exercise.shortDisplayName,
      exercise.movementPattern,
      ...exercise.primaryMuscleGroups,
      ...exercise.secondaryMuscleGroups,
      ...exercise.requiredEquipmentIds,
    ].join(' '),
  );
}

export type ExerciseLibraryFilter = {
  /** What was typed. Empty or whitespace-only means no text filter at all. */
  searchText: string;

  /** Null means every category. */
  movementCategory: MovementCategory | null;
};

/**
 * The exercises matching a filter, in registry order.
 *
 * Registry order rather than alphabetical: `allExercises` groups related
 * movements together, which is a more useful order to browse than one that puts
 * the ankle drill next to the bike.
 *
 * A multi-word search is treated as **every word must match somewhere**, not as
 * one phrase. "cable row" finds the seated cable row whether the words are
 * adjacent in its name or not.
 */
export function filterExerciseLibrary(
  exercises: readonly ExerciseDefinition[],
  filter: ExerciseLibraryFilter,
): ExerciseDefinition[] {
  const searchWords = filter.searchText
    .split(/\s+/)
    .map(normaliseForSearch)
    .filter((word) => word.length > 0);

  return exercises.filter((exercise) => {
    if (filter.movementCategory !== null && exercise.movementCategory !== filter.movementCategory) {
      return false;
    }

    if (searchWords.length === 0) {
      return true;
    }

    const haystack = buildSearchHaystack(exercise);

    return searchWords.every((word) => haystack.includes(word));
  });
}

/** How many exercises of each kind there are. For the filter chips' counts. */
export function countExercisesByMovementCategory(
  exercises: readonly ExerciseDefinition[],
  movementCategory: MovementCategory,
): number {
  return exercises.filter((exercise) => exercise.movementCategory === movementCategory).length;
}
