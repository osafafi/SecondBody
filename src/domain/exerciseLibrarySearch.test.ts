import { describe, expect, it } from 'vitest';

import { allExercises } from '@/content/exercises/allExercises';

import {
  countExercisesByMovementCategory,
  filterExerciseLibrary,
  type ExerciseLibraryFilter,
} from './exerciseLibrarySearch';

/*
 * Against the shipped exercise database rather than a fixture. A search that
 * works on two made-up exercises and cannot find the lat pulldown is a search
 * that passes its tests and fails in a gym.
 */
function buildFilter(overrides: Partial<ExerciseLibraryFilter> = {}): ExerciseLibraryFilter {
  return { searchText: '', movementCategory: null, ...overrides };
}

function findResultIds(filter: Partial<ExerciseLibraryFilter>): string[] {
  return filterExerciseLibrary(allExercises, buildFilter(filter)).map(
    (exercise) => exercise.exerciseId,
  );
}

describe('filterExerciseLibrary', () => {
  it('returns everything when nothing is filtering', () => {
    expect(filterExerciseLibrary(allExercises, buildFilter())).toHaveLength(allExercises.length);
  });

  it('keeps the registry order rather than sorting', () => {
    const filtered = filterExerciseLibrary(allExercises, buildFilter());

    expect(filtered.map((exercise) => exercise.exerciseId)).toEqual(
      allExercises.map((exercise) => exercise.exerciseId),
    );
  });

  it('finds a camelCase id from words typed with a space', () => {
    /* The reason everything is normalised to letters and digits on both sides. */
    expect(findResultIds({ searchText: 'lat pulldown' })).toContain('latPulldown');
  });

  it('ignores case and stray punctuation', () => {
    expect(findResultIds({ searchText: '  LAT-PULLDOWN ' })).toContain('latPulldown');
  });

  it('matches every word rather than the whole phrase', () => {
    const results = findResultIds({ searchText: 'cable row' });

    expect(results.length).toBeGreaterThan(0);
    expect(results).toContain('seatedCableRow');
  });

  it('finds an exercise by what it works, not only by its name', () => {
    const chestResults = findResultIds({ searchText: 'chest' });

    expect(chestResults).toContain('chestPressMachine');
    expect(chestResults).toContain('inclineDumbbellPress');
  });

  it('finds nothing for a word no exercise has, rather than everything', () => {
    expect(findResultIds({ searchText: 'zzzznotamovement' })).toEqual([]);
  });

  it('narrows to one kind of movement', () => {
    const cardioOnly = filterExerciseLibrary(
      allExercises,
      buildFilter({ movementCategory: 'cardio' }),
    );

    expect(cardioOnly.length).toBeGreaterThan(0);
    expect(cardioOnly.every((exercise) => exercise.movementCategory === 'cardio')).toBe(true);
  });

  it('applies the category and the text together', () => {
    /* A strength movement, looked for while the cardio filter is on. */
    expect(findResultIds({ searchText: 'chest press', movementCategory: 'cardio' })).toEqual([]);
  });
});

describe('countExercisesByMovementCategory', () => {
  it('counts each kind, and the three account for the whole library', () => {
    const strength = countExercisesByMovementCategory(allExercises, 'strength');
    const cardio = countExercisesByMovementCategory(allExercises, 'cardio');
    const mobility = countExercisesByMovementCategory(allExercises, 'mobility');

    expect(strength).toBeGreaterThan(0);
    expect(strength + cardio + mobility).toBe(allExercises.length);
  });
});
