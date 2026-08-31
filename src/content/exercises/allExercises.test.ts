import { describe, expect, it } from 'vitest';

import {
  allExercises,
  findExerciseById,
  findExercisesByMovementCategory,
  requireExerciseById,
} from './allExercises';
import { gymEquipment } from '@/content/equipment/gymEquipment';

/**
 * Integrity tests for the exercise database.
 *
 * None of this is testing behaviour — it is testing that the content is
 * internally consistent, so that a mistyped id or a missing form cue fails the
 * build rather than producing a blank panel in a gym with a bar in his hands.
 */

const CAMEL_CASE_PATTERN = /^[a-z][A-Za-z0-9]*$/;

describe('the exercise registry', () => {
  it('holds every exercise the programme needs', () => {
    expect(allExercises.length).toBeGreaterThan(20);
  });

  it('gives every exercise a unique id', () => {
    const exerciseIds = allExercises.map((exercise) => exercise.exerciseId);

    expect(new Set(exerciseIds).size).toBe(exerciseIds.length);
  });

  it('uses camelCase ids, because the id is also the media filename', () => {
    // public/exercise-media/{exerciseId}.gif — see docs/EXERCISE_MEDIA_SPEC.md.
    for (const exercise of allExercises) {
      expect(exercise.exerciseId).toMatch(CAMEL_CASE_PATTERN);
    }
  });
});

describe('every exercise definition', () => {
  it.each(allExercises.map((exercise) => [exercise.exerciseId, exercise] as const))(
    '%s is completely described',
    (_exerciseId, exercise) => {
      expect(exercise.displayName.length).toBeGreaterThan(0);
      expect(exercise.shortDisplayName.length).toBeGreaterThan(0);
      expect(exercise.whyItIsInTheProgramme.length).toBeGreaterThan(0);
      expect(exercise.primaryMuscleGroups.length).toBeGreaterThan(0);
      expect(exercise.requiredEquipmentIds.length).toBeGreaterThan(0);
    },
  );

  it.each(allExercises.map((exercise) => [exercise.exerciseId, exercise] as const))(
    '%s can be coached from the screen',
    (_exerciseId, exercise) => {
      // Omar is effectively a beginner and asked for full cues on every set. One
      // cue is not coaching, it is a label.
      expect(exercise.formCues.length).toBeGreaterThanOrEqual(3);
      expect(exercise.commonMistakes.length).toBeGreaterThanOrEqual(2);

      for (const formCue of exercise.formCues) {
        expect(formCue.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(allExercises.map((exercise) => [exercise.exerciseId, exercise] as const))(
    '%s carries a brief the animation generator can work from',
    (_exerciseId, exercise) => {
      // M3 builds its prompt from these. An empty one produces a wrong animation,
      // which teaches bad information and is worse than having no picture.
      expect(exercise.mediaBrief.startPosition.length).toBeGreaterThan(20);
      expect(exercise.mediaBrief.endPosition.length).toBeGreaterThan(20);
      expect(exercise.mediaBrief.equipmentToDraw.length).toBeGreaterThan(10);
    },
  );

  it('never lists the same muscle group as both primary and secondary', () => {
    for (const exercise of allExercises) {
      const overlap = exercise.primaryMuscleGroups.filter((muscleGroup) =>
        exercise.secondaryMuscleGroups.includes(muscleGroup),
      );

      expect(overlap, `exercise "${exercise.exerciseId}"`).toEqual([]);
    }
  });

  it('only names equipment the app can describe', () => {
    const knownEquipmentIds = new Set(gymEquipment.map((equipment) => equipment.equipmentId));

    for (const exercise of allExercises) {
      for (const equipmentId of exercise.requiredEquipmentIds) {
        expect(knownEquipmentIds, `exercise "${exercise.exerciseId}"`).toContain(equipmentId);
      }
    }
  });

  it('only substitutes exercises that actually exist', () => {
    for (const exercise of allExercises) {
      for (const substituteExerciseId of exercise.substituteExerciseIds) {
        expect(
          findExerciseById(substituteExerciseId),
          `"${exercise.exerciseId}" substitutes "${substituteExerciseId}"`,
        ).not.toBeNull();
      }
    }
  });

  it('never substitutes itself', () => {
    for (const exercise of allExercises) {
      expect(exercise.substituteExerciseIds).not.toContain(exercise.exerciseId);
    }
  });
});

describe('loading styles match what the movement actually is', () => {
  it('gives cardio and mobility movements nothing to load', () => {
    for (const exercise of allExercises) {
      if (exercise.movementCategory === 'cardio' || exercise.movementCategory === 'mobility') {
        expect(exercise.loadingStyle, `exercise "${exercise.exerciseId}"`).toBe('unloaded');
      }
    }
  });

  it('gives every strength movement a way to progress', () => {
    for (const exercise of allExercises) {
      if (exercise.movementCategory === 'strength') {
        expect(exercise.loadingStyle, `exercise "${exercise.exerciseId}"`).not.toBe('unloaded');
      }
    }
  });
});

describe('findExercisesByMovementCategory', () => {
  it('separates the three kinds of movement', () => {
    const strength = findExercisesByMovementCategory('strength');
    const cardio = findExercisesByMovementCategory('cardio');
    const mobility = findExercisesByMovementCategory('mobility');

    expect(strength.length).toBeGreaterThan(0);
    expect(cardio.length).toBeGreaterThan(0);
    expect(mobility.length).toBeGreaterThan(0);
    expect(strength.length + cardio.length + mobility.length).toBe(allExercises.length);
  });
});

describe('findExerciseById and requireExerciseById', () => {
  it('finds a real exercise', () => {
    expect(findExerciseById('legExtension')?.displayName).toBe('Leg Extension');
    expect(requireExerciseById('legExtension').displayName).toBe('Leg Extension');
  });

  it('returns null for an unknown id rather than throwing', () => {
    expect(findExerciseById('cableCrunchOfDoom')).toBeNull();
  });

  it('throws for an unknown id when the caller says the content guarantees it', () => {
    expect(() => requireExerciseById('cableCrunchOfDoom')).toThrow(/cableCrunchOfDoom/);
  });
});
