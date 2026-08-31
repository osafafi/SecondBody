import { describe, expect, it } from 'vitest';

import {
  EXPECTED_WEEKLY_WEIGHT_CHANGE_KILOGRAMS,
  FINAL_WEEK_FOR_EARLY_SCALE_REASSURANCE,
  projectExpectedWeightRangeKilograms,
  shouldSurfaceEarlyScaleReassurance,
} from './bodyWeightExpectations';

describe('shouldSurfaceEarlyScaleReassurance', () => {
  it('raises the water weight explanation across weeks 1 to 3', () => {
    expect(shouldSurfaceEarlyScaleReassurance(1)).toBe(true);
    expect(shouldSurfaceEarlyScaleReassurance(2)).toBe(true);
    expect(shouldSurfaceEarlyScaleReassurance(3)).toBe(true);
  });

  it('stops after week 3, so it does not become nagging', () => {
    expect(shouldSurfaceEarlyScaleReassurance(4)).toBe(false);
    expect(shouldSurfaceEarlyScaleReassurance(12)).toBe(false);
  });

  it('says nothing before the programme has started', () => {
    expect(shouldSurfaceEarlyScaleReassurance(0)).toBe(false);
  });

  it('covers the window the training document names', () => {
    expect(FINAL_WEEK_FOR_EARLY_SCALE_REASSURANCE).toBe(3);
  });
});

describe('projectExpectedWeightRangeKilograms', () => {
  it('expects no loss at all through the first three weeks', () => {
    expect(projectExpectedWeightRangeKilograms(90, 0)).toEqual({ heaviest: 90, lightest: 90 });
    expect(projectExpectedWeightRangeKilograms(90, 3)).toEqual({ heaviest: 90, lightest: 90 });
  });

  it('expects 0.4 to 0.5 kg a week once it starts moving', () => {
    expect(projectExpectedWeightRangeKilograms(90, 4)).toEqual({ heaviest: 89.6, lightest: 89.5 });
  });

  it('projects the end of the twelve weeks in the low eighties', () => {
    const atTwelveWeeks = projectExpectedWeightRangeKilograms(90, 12);

    // Nine weeks of loss: 3.6 to 4.5 kg, which is the 85-86 kg the training
    // document expects at this point on the way to 82-84 kg.
    expect(atTwelveWeeks).toEqual({ heaviest: 86.4, lightest: 85.5 });
  });

  it('never has the optimistic end above the pessimistic one', () => {
    for (let weeksElapsed = 0; weeksElapsed <= 20; weeksElapsed += 1) {
      const range = projectExpectedWeightRangeKilograms(90, weeksElapsed);

      expect(range.lightest, `week ${weeksElapsed}`).toBeLessThanOrEqual(range.heaviest);
    }
  });

  it('treats a negative elapsed time as no time at all', () => {
    expect(projectExpectedWeightRangeKilograms(90, -5)).toEqual({ heaviest: 90, lightest: 90 });
  });

  it('uses the rate the training document specifies', () => {
    expect(EXPECTED_WEEKLY_WEIGHT_CHANGE_KILOGRAMS.slowest).toBe(0.4);
    expect(EXPECTED_WEEKLY_WEIGHT_CHANGE_KILOGRAMS.fastest).toBe(0.5);
  });
});
