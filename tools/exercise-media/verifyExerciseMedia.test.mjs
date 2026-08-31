import { readdir } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  EXERCISE_MEDIA_DIRECTORY,
  loadAllExercises,
  loadExerciseMediaMatches,
  MEDIA_FILE_EXTENSION,
} from './exerciseMediaDataset.mjs';
import { findExerciseMediaProblems } from './verifyExerciseMedia.mjs';

/**
 * A repository where everything agrees, so each test can break exactly one
 * thing and assert that the check notices.
 *
 * Without this the tests would only prove that a broken repository produces
 * *some* complaint, which a check that rejected everything would also pass.
 */
function consistentRepository() {
  return {
    exercises: [{ exerciseId: 'gobletSquat' }, { exerciseId: 'catCow' }],
    matches: [
      {
        exerciseId: 'gobletSquat',
        datasetExerciseId: '1760',
        datasetExerciseName: 'dumbbell goblet squat',
        matchQuality: 'exact',
        differenceFromOurVersion: '',
      },
    ],
    misses: [{ exerciseId: 'catCow', whyThereIsNoMatch: 'Nothing on all fours in the dataset.' }],
    committedFileNames: new Set(['gobletSquat.gif']),
  };
}

describe('findExerciseMediaProblems', () => {
  it('accepts a repository whose table and files agree', async () => {
    expect(await findExerciseMediaProblems(consistentRepository())).toEqual([]);
  });

  it('catches a match whose file was never copied in', async () => {
    const repository = consistentRepository();
    repository.committedFileNames = new Set();

    const [problem] = await findExerciseMediaProblems(repository);

    expect(problem).toContain('gobletSquat.gif is not committed');
    expect(problem).toContain('npm run media:copy gobletSquat');
  });

  it('catches a file nothing asks for', async () => {
    const repository = consistentRepository();
    repository.committedFileNames.add('barbellRomanianDeadlift.gif');

    expect(await findExerciseMediaProblems(repository)).toEqual([
      expect.stringContaining('barbellRomanianDeadlift.gif is committed but nothing'),
    ]);
  });

  it('catches an exercise that is in neither list', async () => {
    const repository = consistentRepository();
    repository.exercises.push({ exerciseId: 'deadBug' });

    expect(await findExerciseMediaProblems(repository)).toEqual([
      expect.stringContaining('"deadBug" is in neither list'),
    ]);
  });

  it('catches a match pointing at an exercise that does not exist', async () => {
    const repository = consistentRepository();
    repository.exercises = repository.exercises.filter(
      (exercise) => exercise.exerciseId !== 'gobletSquat',
    );

    expect(await findExerciseMediaProblems(repository)).toEqual([
      expect.stringContaining('"gobletSquat", which is not an exercise'),
    ]);
  });

  it('catches an exercise listed as both matched and unmatched', async () => {
    const repository = consistentRepository();
    repository.misses.push({ exerciseId: 'gobletSquat', whyThereIsNoMatch: 'Contradiction.' });

    // A contradiction trips two rules, and both complaints are true: it is in
    // both lists, and one of those lists says its file should not exist.
    expect(await findExerciseMediaProblems(repository)).toEqual([
      expect.stringContaining('cannot be both'),
      expect.stringContaining('listed as having no match'),
    ]);
  });

  it('catches a file committed for an exercise that is meant to have none', async () => {
    const repository = consistentRepository();
    repository.committedFileNames.add('catCow.gif');

    // Both complaints are true and both are worth saying: the file contradicts
    // the table, and nothing in the table asks for it.
    expect(await findExerciseMediaProblems(repository)).toEqual([
      expect.stringContaining('catCow.gif is committed'),
      expect.stringContaining('catCow.gif is committed but nothing'),
    ]);
  });

  it('catches a close match with no note saying what differs', async () => {
    const repository = consistentRepository();
    repository.matches[0].matchQuality = 'close';

    expect(await findExerciseMediaProblems(repository)).toEqual([
      expect.stringContaining('close match with no note'),
    ]);
  });
});

describe('the committed media', () => {
  it('agrees with the committed match table', async () => {
    const [exercises, { matches, misses }, directoryEntries] = await Promise.all([
      loadAllExercises(),
      loadExerciseMediaMatches(),
      readdir(EXERCISE_MEDIA_DIRECTORY),
    ]);

    const committedFileNames = new Set(
      directoryEntries.filter((fileName) => fileName.endsWith(MEDIA_FILE_EXTENSION)),
    );

    expect(
      await findExerciseMediaProblems({ exercises, matches, misses, committedFileNames }),
    ).toEqual([]);
  });
});
