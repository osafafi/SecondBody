import { describe, expect, it } from 'vitest';

import {
  calculateDailyStepTarget,
  hasMetDailyStepTarget,
  hasMetNightlySleepTarget,
} from './habitTargets';
import { stepCountTargets } from '@/content/habits/dailyHabitDefinitions';

const TWELVE_WEEK_RAMP = {
  totalWeekCount: 12,
  startingDailyStepTarget: stepCountTargets.startingDailyStepTarget,
  finalDailyStepTarget: stepCountTargets.finalDailyStepTarget,
};

describe('calculateDailyStepTarget', () => {
  it('starts at 5,000 in week 1', () => {
    expect(calculateDailyStepTarget({ ...TWELVE_WEEK_RAMP, weekNumber: 1 })).toBe(5000);
  });

  it('finishes at 9,000 in week 12', () => {
    expect(calculateDailyStepTarget({ ...TWELVE_WEEK_RAMP, weekNumber: 12 })).toBe(9000);
  });

  it('climbs steadily in between, never going backwards', () => {
    let previousTarget = 0;

    for (let weekNumber = 1; weekNumber <= 12; weekNumber += 1) {
      const target = calculateDailyStepTarget({ ...TWELVE_WEEK_RAMP, weekNumber });

      expect(target, `week ${weekNumber}`).toBeGreaterThanOrEqual(previousTarget);
      previousTarget = target;
    }
  });

  it('is about halfway up by the middle of the programme', () => {
    const middleTarget = calculateDailyStepTarget({ ...TWELVE_WEEK_RAMP, weekNumber: 6 });

    expect(middleTarget).toBeGreaterThan(6000);
    expect(middleTarget).toBeLessThan(8000);
  });

  it('gives a round number, so the target reads like a target', () => {
    for (let weekNumber = 1; weekNumber <= 12; weekNumber += 1) {
      const target = calculateDailyStepTarget({ ...TWELVE_WEEK_RAMP, weekNumber });

      expect(target % 250, `week ${weekNumber}`).toBe(0);
    }
  });

  it('clamps rather than extrapolating outside the programme', () => {
    expect(calculateDailyStepTarget({ ...TWELVE_WEEK_RAMP, weekNumber: 0 })).toBe(5000);
    expect(calculateDailyStepTarget({ ...TWELVE_WEEK_RAMP, weekNumber: 40 })).toBe(9000);
  });

  it('handles a single week programme without dividing by zero', () => {
    expect(
      calculateDailyStepTarget({
        weekNumber: 1,
        totalWeekCount: 1,
        startingDailyStepTarget: 5000,
        finalDailyStepTarget: 9000,
      }),
    ).toBe(9000);
  });
});

describe('hasMetDailyStepTarget', () => {
  it('is met at or above the target', () => {
    expect(hasMetDailyStepTarget(5000, 5000)).toBe(true);
    expect(hasMetDailyStepTarget(7200, 5000)).toBe(true);
  });

  it('is not met below the target', () => {
    expect(hasMetDailyStepTarget(4999, 5000)).toBe(false);
  });

  it('is not met when nothing was recorded', () => {
    expect(hasMetDailyStepTarget(null, 5000)).toBe(false);
  });
});

describe('hasMetNightlySleepTarget', () => {
  it('is met at or above the target', () => {
    expect(hasMetNightlySleepTarget(7, 7)).toBe(true);
    expect(hasMetNightlySleepTarget(8.5, 7)).toBe(true);
  });

  it('is not met below the target, or when nothing was recorded', () => {
    expect(hasMetNightlySleepTarget(6.5, 7)).toBe(false);
    expect(hasMetNightlySleepTarget(null, 7)).toBe(false);
  });
});
