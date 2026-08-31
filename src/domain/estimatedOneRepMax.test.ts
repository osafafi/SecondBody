import { describe, expect, it } from 'vitest';

import { calculateEstimatedOneRepMaxKilograms, isNewPersonalRecord } from './estimatedOneRepMax';

describe('calculateEstimatedOneRepMaxKilograms', () => {
  it('returns the weight itself for a single rep', () => {
    expect(calculateEstimatedOneRepMaxKilograms(60, 1)).toBe(62);
  });

  it('applies Epley: weight times one plus reps over thirty', () => {
    // 60 x (1 + 10/30) = 80
    expect(calculateEstimatedOneRepMaxKilograms(60, 10)).toBe(80);
    // 40 x (1 + 12/30) = 56
    expect(calculateEstimatedOneRepMaxKilograms(40, 12)).toBe(56);
  });

  it('rates more reps at the same weight as a bigger estimate', () => {
    const eightReps = calculateEstimatedOneRepMaxKilograms(50, 8);
    const twelveReps = calculateEstimatedOneRepMaxKilograms(50, 12);

    expect(twelveReps).toBeGreaterThan(eightReps);
  });

  it('rounds to one decimal place, because a gym is not more precise than that', () => {
    expect(calculateEstimatedOneRepMaxKilograms(42.5, 11)).toBe(58.1);
  });

  it('returns zero for a set that was not really a set', () => {
    expect(calculateEstimatedOneRepMaxKilograms(60, 0)).toBe(0);
    expect(calculateEstimatedOneRepMaxKilograms(0, 10)).toBe(0);
    expect(calculateEstimatedOneRepMaxKilograms(-10, 10)).toBe(0);
  });
});

describe('isNewPersonalRecord', () => {
  it('beats the record when the estimate is higher', () => {
    expect(isNewPersonalRecord(60, 10, 79)).toBe(true);
  });

  it('does not beat the record when the estimate merely ties it', () => {
    expect(isNewPersonalRecord(60, 10, 80)).toBe(false);
  });

  it('counts extra reps at the same weight as a record', () => {
    const previousBest = calculateEstimatedOneRepMaxKilograms(50, 10);

    expect(isNewPersonalRecord(50, 12, previousBest)).toBe(true);
  });

  it('counts more weight for fewer reps as a record when it is genuinely more', () => {
    const previousBest = calculateEstimatedOneRepMaxKilograms(50, 12);

    expect(isNewPersonalRecord(60, 10, previousBest)).toBe(true);
    expect(isNewPersonalRecord(52.5, 8, previousBest)).toBe(false);
  });

  it('is never a record when nothing was lifted', () => {
    expect(isNewPersonalRecord(0, 0, 0)).toBe(false);
  });
});
