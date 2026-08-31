import { describe, expect, it } from 'vitest';

import {
  calculateHoursBetween,
  calculateWholeDaysBetween,
  determineSessionStartEligibility,
  findNextTrainingDate,
  isMorningSession,
  isTrainingDay,
} from './sessionScheduling';

/**
 * Every date below is constructed explicitly. Nothing here reads a clock, which
 * is what makes "what happens at 23:00 on a Sunday" a test rather than something
 * discovered in a gym.
 *
 * 2026-09-07 is a Monday, which makes the weekday arithmetic below readable.
 */
const MONDAY_MORNING = new Date(2026, 8, 7, 7, 30);
const MONDAY_EVENING = new Date(2026, 8, 7, 19, 0);
const WEDNESDAY_EVENING = new Date(2026, 8, 9, 19, 0);
const MONDAY_WEDNESDAY_FRIDAY = [1, 3, 5];

describe('calculateHoursBetween', () => {
  it('counts the hours from the earlier moment to the later one', () => {
    expect(calculateHoursBetween(MONDAY_MORNING, MONDAY_EVENING)).toBe(11.5);
  });

  it('goes negative when the arguments are the wrong way round', () => {
    expect(calculateHoursBetween(MONDAY_EVENING, MONDAY_MORNING)).toBe(-11.5);
  });
});

describe('calculateWholeDaysBetween', () => {
  it('counts whole days and rounds the remainder down', () => {
    expect(calculateWholeDaysBetween(MONDAY_MORNING, WEDNESDAY_EVENING)).toBe(2);
  });

  it('is zero on the same day', () => {
    expect(calculateWholeDaysBetween(MONDAY_MORNING, MONDAY_EVENING)).toBe(0);
  });
});

describe('determineSessionStartEligibility — the 48 hour rail', () => {
  it('lets a first ever session start', () => {
    const eligibility = determineSessionStartEligibility({
      now: MONDAY_EVENING,
      lastCompletedSessionAt: null,
      minimumHoursBetweenSessions: 48,
    });

    expect(eligibility.isAllowedToStartNow).toBe(true);
    expect(eligibility.hoursUntilAllowed).toBe(0);
  });

  it('refuses a second session on the same day', () => {
    const eligibility = determineSessionStartEligibility({
      now: MONDAY_EVENING,
      lastCompletedSessionAt: MONDAY_MORNING,
      minimumHoursBetweenSessions: 48,
    });

    expect(eligibility.isAllowedToStartNow).toBe(false);
    expect(eligibility.hoursUntilAllowed).toBe(36.5);
  });

  it('refuses a session that is one hour too early', () => {
    const oneHourShort = new Date(MONDAY_MORNING.getTime() + 47 * 60 * 60 * 1000);

    const eligibility = determineSessionStartEligibility({
      now: oneHourShort,
      lastCompletedSessionAt: MONDAY_MORNING,
      minimumHoursBetweenSessions: 48,
    });

    expect(eligibility.isAllowedToStartNow).toBe(false);
    expect(eligibility.hoursUntilAllowed).toBe(1);
  });

  it('allows a session at exactly 48 hours', () => {
    const exactlyFortyEightHours = new Date(MONDAY_MORNING.getTime() + 48 * 60 * 60 * 1000);

    expect(
      determineSessionStartEligibility({
        now: exactlyFortyEightHours,
        lastCompletedSessionAt: MONDAY_MORNING,
        minimumHoursBetweenSessions: 48,
      }).isAllowedToStartNow,
    ).toBe(true);
  });

  it('allows the usual Monday-to-Wednesday gap', () => {
    expect(
      determineSessionStartEligibility({
        now: WEDNESDAY_EVENING,
        lastCompletedSessionAt: MONDAY_EVENING,
        minimumHoursBetweenSessions: 48,
      }).isAllowedToStartNow,
    ).toBe(true);
  });
});

describe('isTrainingDay', () => {
  it('is true on Monday, Wednesday and Friday', () => {
    expect(isTrainingDay(MONDAY_MORNING, MONDAY_WEDNESDAY_FRIDAY)).toBe(true);
    expect(isTrainingDay(WEDNESDAY_EVENING, MONDAY_WEDNESDAY_FRIDAY)).toBe(true);
  });

  it('is false on a Tuesday', () => {
    const tuesday = new Date(2026, 8, 8, 12, 0);

    expect(isTrainingDay(tuesday, MONDAY_WEDNESDAY_FRIDAY)).toBe(false);
  });
});

describe('findNextTrainingDate', () => {
  it('returns today when today is already a training day', () => {
    expect(findNextTrainingDate(MONDAY_MORNING, MONDAY_WEDNESDAY_FRIDAY)?.getDay()).toBe(1);
  });

  it('finds Wednesday from a Tuesday', () => {
    const tuesday = new Date(2026, 8, 8, 12, 0);

    expect(findNextTrainingDate(tuesday, MONDAY_WEDNESDAY_FRIDAY)?.getDay()).toBe(3);
  });

  it('wraps round the weekend to the following Monday', () => {
    const saturday = new Date(2026, 8, 12, 12, 0);
    const nextTrainingDate = findNextTrainingDate(saturday, MONDAY_WEDNESDAY_FRIDAY);

    expect(nextTrainingDate?.getDay()).toBe(1);
    expect(nextTrainingDate?.getDate()).toBe(14);
  });

  it('keeps the time of day it was given', () => {
    const tuesday = new Date(2026, 8, 8, 18, 45);

    expect(findNextTrainingDate(tuesday, MONDAY_WEDNESDAY_FRIDAY)?.getHours()).toBe(18);
  });

  it('returns null when no day is a training day', () => {
    expect(findNextTrainingDate(MONDAY_MORNING, [])).toBeNull();
    expect(findNextTrainingDate(MONDAY_MORNING, [9])).toBeNull();
  });
});

describe('isMorningSession', () => {
  it('is true before the cutoff', () => {
    expect(isMorningSession(7, 10)).toBe(true);
    expect(isMorningSession(9, 10)).toBe(true);
  });

  it('is false at and after the cutoff', () => {
    expect(isMorningSession(10, 10)).toBe(false);
    expect(isMorningSession(18, 10)).toBe(false);
  });
});
