import { describe, expect, it } from 'vitest';

import {
  describeLibrarySize,
  describeMuscleGroups,
  describeRequiredEquipment,
} from './exerciseLibraryWording';

describe('describeMuscleGroups', () => {
  it('says nothing for an empty list, rather than an empty sentence', () => {
    expect(describeMuscleGroups([])).toBe('');
  });

  it('leaves a single muscle group alone', () => {
    expect(describeMuscleGroups(['chest'])).toBe('Chest');
  });

  it('joins the last one with an "and" rather than a comma', () => {
    expect(describeMuscleGroups(['chest', 'frontDeltoids', 'triceps'])).toBe(
      'Chest, Front delts and Triceps',
    );
  });
});

describe('describeRequiredEquipment', () => {
  it('reads the names off the equipment content', () => {
    expect(describeRequiredEquipment(['dumbbells', 'adjustableBench'])).toBe(
      'Dumbbells and Adjustable bench',
    );
  });
});

describe('describeLibrarySize', () => {
  it('names the whole library when nothing is filtering', () => {
    expect(describeLibrarySize(36, 36)).toBe('36 movements');
  });

  it('keeps the total in view while something is filtering', () => {
    /*
     * "3 movements" on a screen with a search box reads as a very small library
     * rather than as a narrow search.
     */
    expect(describeLibrarySize(3, 36)).toBe('3 of 36 movements');
  });

  it('agrees with itself about one', () => {
    expect(describeLibrarySize(1, 1)).toBe('1 movement');
  });
});
