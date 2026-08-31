import { exerciseMediaMatches, exercisesWithoutMediaMatch } from './exerciseMediaMatches';
import type { ExerciseMediaMatch, ExerciseWithoutMediaMatch } from './exerciseMediaTypes';

/**
 * The flat registry of exercise media, for everything that needs to ask a
 * question about one exercise rather than read the whole table.
 *
 * `exerciseMediaMatches.ts` is the reviewable unit — it is read top to bottom in
 * a pull request, with the reasoning attached to each row. This is the index.
 */

const matchesByExerciseId = new Map<string, ExerciseMediaMatch>(
  exerciseMediaMatches.map((match) => [match.exerciseId, match]),
);

const missesByExerciseId = new Map<string, ExerciseWithoutMediaMatch>(
  exercisesWithoutMediaMatch.map((miss) => [miss.exerciseId, miss]),
);

/** The chosen dataset animation for an exercise, or null when there is not one. */
export function findExerciseMediaMatch(exerciseId: string): ExerciseMediaMatch | null {
  return matchesByExerciseId.get(exerciseId) ?? null;
}

/** Why an exercise has no animation, or null when it has one. */
export function findReasonExerciseHasNoMedia(exerciseId: string): string | null {
  return missesByExerciseId.get(exerciseId)?.whyThereIsNoMatch ?? null;
}

/**
 * True when `public/exercise-media/{exerciseId}.gif` is committed.
 *
 * The app asks this rather than requesting the file and handling a 404: the
 * table is committed alongside the files and `exerciseMediaMatches.test.ts`
 * proves the two agree, so a missing preview is a fact that is known before
 * anything is rendered instead of a failed request a phone has to wait for.
 */
export function hasExerciseMedia(exerciseId: string): boolean {
  return matchesByExerciseId.has(exerciseId);
}

/**
 * Where an exercise's animation is served from.
 *
 * `import.meta.env.BASE_URL` rather than a leading slash, because the built app
 * is served from a GitHub Pages sub-path. See `vite.config.ts`.
 */
export function buildExerciseMediaUrl(exerciseId: string): string {
  return `${import.meta.env.BASE_URL}exercise-media/${exerciseId}.gif`;
}
