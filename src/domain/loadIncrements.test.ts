import { describe, expect, it } from 'vitest';

import {
  calculateEffectiveLoadKilograms,
  isLoadableLoadingStyle,
  LOAD_INCREMENT_KILOGRAMS_BY_LOADING_STYLE,
  resolveSmallestLoadIncrementKilograms,
  roundWeightDownToLoadableValue,
  roundWeightToNearestLoadableValue,
} from './loadIncrements';
import { LOADING_STYLES } from '@/types/trainingVocabulary';

describe('resolveSmallestLoadIncrementKilograms', () => {
  it.each([
    ['weightStackMachine', 2.5],
    ['cableStack', 2.5],
    ['barbell', 2.5],
    ['dumbbellPair', 2],
    ['singleDumbbell', 2],
    ['bodyweight', 0],
    ['unloaded', 0],
  ] as const)('steps %s by %s kg', (loadingStyle, expectedIncrement) => {
    expect(resolveSmallestLoadIncrementKilograms(loadingStyle)).toBe(expectedIncrement);
  });

  it('defines an increment for every loading style, so a new one cannot be forgotten', () => {
    for (const loadingStyle of LOADING_STYLES) {
      expect(
        LOAD_INCREMENT_KILOGRAMS_BY_LOADING_STYLE[loadingStyle],
        `loading style "${loadingStyle}"`,
      ).toBeTypeOf('number');
    }
  });
});

describe('isLoadableLoadingStyle', () => {
  it('is true for anything with weight to add', () => {
    expect(isLoadableLoadingStyle('weightStackMachine')).toBe(true);
    expect(isLoadableLoadingStyle('dumbbellPair')).toBe(true);
  });

  it('is false for bodyweight and unloaded movements, which progress by reps', () => {
    expect(isLoadableLoadingStyle('bodyweight')).toBe(false);
    expect(isLoadableLoadingStyle('unloaded')).toBe(false);
  });
});

describe('roundWeightToNearestLoadableValue', () => {
  it.each([
    [36, 35],
    [36.3, 37.5],
    [40, 40],
    [41.2, 40],
  ])('rounds %s kg on a weight stack to %s kg', (rawWeight, expectedWeight) => {
    expect(roundWeightToNearestLoadableValue(rawWeight, 'weightStackMachine')).toBe(expectedWeight);
  });

  it('rounds dumbbells to the next dumbbell that exists', () => {
    expect(roundWeightToNearestLoadableValue(9, 'dumbbellPair')).toBe(10);
    expect(roundWeightToNearestLoadableValue(8.6, 'dumbbellPair')).toBe(8);
  });

  it('never returns less than a single increment, so the prescription is always selectable', () => {
    expect(roundWeightToNearestLoadableValue(0.4, 'weightStackMachine')).toBe(2.5);
    expect(roundWeightToNearestLoadableValue(0, 'dumbbellPair')).toBe(2);
  });

  it('returns zero for movements that carry no weight', () => {
    expect(roundWeightToNearestLoadableValue(50, 'bodyweight')).toBe(0);
    expect(roundWeightToNearestLoadableValue(50, 'unloaded')).toBe(0);
  });

  it('leaves no floating point residue behind', () => {
    // 0.1 + 0.2 arithmetic on 2.5 kg steps is exactly where this shows up.
    expect(roundWeightToNearestLoadableValue(17.5, 'weightStackMachine')).toBe(17.5);
    expect(roundWeightToNearestLoadableValue(7.5000001, 'weightStackMachine')).toBe(7.5);
  });
});

describe('roundWeightDownToLoadableValue', () => {
  it('rounds down, so a reduction is never quietly turned into an increase', () => {
    // 40 kg less twenty percent is 32 kg. Rounding to nearest would give 32.5,
    // which is heavier than the reduction asked for.
    expect(roundWeightDownToLoadableValue(32, 'weightStackMachine')).toBe(30);
  });

  it('leaves an already-selectable weight alone', () => {
    expect(roundWeightDownToLoadableValue(35, 'weightStackMachine')).toBe(35);
    expect(roundWeightDownToLoadableValue(8, 'dumbbellPair')).toBe(8);
  });

  it('never returns less than a single increment', () => {
    expect(roundWeightDownToLoadableValue(1, 'weightStackMachine')).toBe(2.5);
    expect(roundWeightDownToLoadableValue(0, 'singleDumbbell')).toBe(2);
  });

  it('returns zero for movements that carry no weight', () => {
    expect(roundWeightDownToLoadableValue(50, 'bodyweight')).toBe(0);
  });
});

describe('calculateEffectiveLoadKilograms', () => {
  it('counts both dumbbells of a pair', () => {
    expect(calculateEffectiveLoadKilograms(8, 'dumbbellPair')).toBe(16);
  });

  it('counts a single dumbbell once', () => {
    expect(calculateEffectiveLoadKilograms(10, 'singleDumbbell')).toBe(10);
  });

  it('counts a machine or barbell weight once', () => {
    expect(calculateEffectiveLoadKilograms(40, 'weightStackMachine')).toBe(40);
    expect(calculateEffectiveLoadKilograms(20, 'barbell')).toBe(20);
  });
});
