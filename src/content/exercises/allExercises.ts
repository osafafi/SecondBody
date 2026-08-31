import type { ExerciseDefinition } from '@/types/exerciseTypes';
import type { MovementCategory } from '@/types/trainingVocabulary';

import { cardioExercises } from './cardioExercises';
import { coreAndCarryExercises } from './coreAndCarryExercises';
import { lowerBodyExercises } from './lowerBodyExercises';
import { mobilityExercises } from './mobilityExercises';
import { upperBodyPullExercises } from './upperBodyPullExercises';
import { upperBodyPushExercises } from './upperBodyPushExercises';

/**
 * Every exercise the app knows about.
 *
 * The grouped files are the reviewable unit — related movements sit together so
 * a change to the pulling work is one diff — and this is the flat registry
 * everything else reads. `allExercises.test.ts` proves the whole set is
 * internally consistent, so a typo in an id fails the build rather than
 * producing a blank screen in a gym.
 */
export const allExercises: ExerciseDefinition[] = [
  ...lowerBodyExercises,
  ...upperBodyPullExercises,
  ...upperBodyPushExercises,
  ...coreAndCarryExercises,
  ...cardioExercises,
  ...mobilityExercises,
];

const exercisesById = new Map<string, ExerciseDefinition>(
  allExercises.map((exercise) => [exercise.exerciseId, exercise]),
);

/** Looks an exercise up by id. Returns null when there is no such exercise. */
export function findExerciseById(exerciseId: string): ExerciseDefinition | null {
  return exercisesById.get(exerciseId) ?? null;
}

/**
 * Looks an exercise up by id and throws when it is missing.
 *
 * For the many places that are reading an id which came from committed content
 * and where a miss means the content is broken, not that the user did something
 * unexpected. Prefer `findExerciseById` for anything driven by stored data.
 */
export function requireExerciseById(exerciseId: string): ExerciseDefinition {
  const exercise = exercisesById.get(exerciseId);

  if (!exercise) {
    throw new Error(`No exercise is defined with the id "${exerciseId}".`);
  }

  return exercise;
}

/** Every exercise of one kind, in registry order. */
export function findExercisesByMovementCategory(
  movementCategory: MovementCategory,
): ExerciseDefinition[] {
  return allExercises.filter((exercise) => exercise.movementCategory === movementCategory);
}
