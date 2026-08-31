import { describe, expect, it } from 'vitest';

import { allExercises } from '@/content/exercises/allExercises';

import {
  buildExerciseMediaUrl,
  findExerciseMediaMatch,
  findReasonExerciseHasNoMedia,
  hasExerciseMedia,
} from './allExerciseMedia';
import { exerciseMediaMatches, exercisesWithoutMediaMatch } from './exerciseMediaMatches';
import { EXERCISE_MEDIA_MATCH_QUALITIES } from './exerciseMediaTypes';

/**
 * These prove the table is internally consistent and that it covers every
 * exercise. That the *files* on disk agree with it is a separate question, and
 * it is answered in `tools/exercise-media/verifyExerciseMedia.test.mjs` — this
 * layer cannot see the filesystem.
 */
describe('the exercise media match table', () => {
  it('accounts for every exercise exactly once', () => {
    const accountedFor = [
      ...exerciseMediaMatches.map((match) => match.exerciseId),
      ...exercisesWithoutMediaMatch.map((miss) => miss.exerciseId),
    ].sort();

    const everyExerciseId = allExercises.map((exercise) => exercise.exerciseId).sort();

    expect(accountedFor).toEqual(everyExerciseId);
  });

  it('names only real exercises', () => {
    const everyExerciseId = new Set(allExercises.map((exercise) => exercise.exerciseId));

    for (const match of exerciseMediaMatches) {
      expect(everyExerciseId.has(match.exerciseId), match.exerciseId).toBe(true);
    }

    for (const miss of exercisesWithoutMediaMatch) {
      expect(everyExerciseId.has(miss.exerciseId), miss.exerciseId).toBe(true);
    }
  });

  it('points at dataset records in the format the dataset uses', () => {
    for (const match of exerciseMediaMatches) {
      // Four or more digits, zero-padded. The dataset's schema promises four;
      // some of its later records run past that.
      expect(match.datasetExerciseId, match.exerciseId).toMatch(/^\d{4,}$/);
      expect(match.datasetExerciseName.length, match.exerciseId).toBeGreaterThan(2);
      expect(EXERCISE_MEDIA_MATCH_QUALITIES, match.exerciseId).toContain(match.matchQuality);
    }
  });

  it('explains every close match', () => {
    // A close match is a compromise. The note is the only thing that lets
    // someone reviewing this decide whether it is one worth keeping, so a close
    // match without one is not reviewable and does not belong in the table.
    for (const match of exerciseMediaMatches) {
      if (match.matchQuality === 'close') {
        expect(match.differenceFromOurVersion.length, match.exerciseId).toBeGreaterThan(30);
      } else {
        expect(match.differenceFromOurVersion, match.exerciseId).toBe('');
      }
    }
  });

  it('explains every exercise it gave up on', () => {
    // Written for whoever fixes it: what was searched for, and what the nearest
    // miss was. "No match" on its own just means the search has to be repeated.
    for (const miss of exercisesWithoutMediaMatch) {
      expect(miss.whyThereIsNoMatch.length, miss.exerciseId).toBeGreaterThan(40);
    }
  });
});

describe('looking media up', () => {
  it('finds the match for an exercise that has one', () => {
    expect(findExerciseMediaMatch('legExtension')).toMatchObject({
      datasetExerciseId: '0585',
      matchQuality: 'exact',
    });

    expect(hasExerciseMedia('legExtension')).toBe(true);
    expect(findReasonExerciseHasNoMedia('legExtension')).toBeNull();
  });

  it('gives the reason for an exercise that has none', () => {
    expect(findExerciseMediaMatch('catCow')).toBeNull();
    expect(hasExerciseMedia('catCow')).toBe(false);
    expect(findReasonExerciseHasNoMedia('catCow')).toContain('quadruped');
  });

  it('treats an unknown id as having no media rather than throwing', () => {
    // Sessions logged in M5 store exercise ids. One that has since been renamed
    // must degrade to a missing preview, not to a crashed screen.
    expect(findExerciseMediaMatch('noSuchExercise')).toBeNull();
    expect(hasExerciseMedia('noSuchExercise')).toBe(false);
    expect(findReasonExerciseHasNoMedia('noSuchExercise')).toBeNull();
  });

  it('builds urls that survive being served from a sub-path', () => {
    // GitHub Pages serves the app from /repository-name/, so a leading slash
    // would break every animation in production and none of them locally.
    expect(buildExerciseMediaUrl('deadBug')).toBe(
      `${import.meta.env.BASE_URL}exercise-media/deadBug.gif`,
    );
  });
});
