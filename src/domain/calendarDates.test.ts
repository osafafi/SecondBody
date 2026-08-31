import { describe, expect, it } from 'vitest';

import {
  addLocalDays,
  countCalendarDaysBetween,
  formatIsoDate,
  isSameLocalDay,
  startOfLocalDay,
  startOfLocalWeek,
} from './calendarDates';

describe('formatIsoDate', () => {
  it('pads the month and the day to two digits', () => {
    expect(formatIsoDate(new Date(2026, 8, 1, 13, 45))).toBe('2026-09-01');
  });

  it('reads the local calendar rather than UTC', () => {
    // 23:30 local. In any time zone east of Greenwich this is already the next
    // day in UTC, and the date shown on the calendar is still this one.
    const lateEvening = new Date(2026, 0, 31, 23, 30);

    expect(formatIsoDate(lateEvening)).toBe('2026-01-31');
  });
});

describe('startOfLocalDay', () => {
  it('winds the clock back to midnight', () => {
    const startOfDay = startOfLocalDay(new Date(2026, 5, 17, 19, 42, 11, 500));

    expect(startOfDay.getHours()).toBe(0);
    expect(startOfDay.getMinutes()).toBe(0);
    expect(startOfDay.getSeconds()).toBe(0);
    expect(startOfDay.getMilliseconds()).toBe(0);
    expect(formatIsoDate(startOfDay)).toBe('2026-06-17');
  });

  it('does not modify the date it was given', () => {
    const evening = new Date(2026, 5, 17, 19, 42);
    startOfLocalDay(evening);

    expect(evening.getHours()).toBe(19);
  });
});

describe('addLocalDays', () => {
  it('moves forward across a month boundary', () => {
    expect(formatIsoDate(addLocalDays(new Date(2026, 0, 30), 3))).toBe('2026-02-02');
  });

  it('moves backwards when the count is negative', () => {
    expect(formatIsoDate(addLocalDays(new Date(2026, 2, 2), -3))).toBe('2026-02-27');
  });

  it('keeps the time of day rather than the elapsed duration', () => {
    const morning = new Date(2026, 9, 24, 8, 30);
    const nextMorning = addLocalDays(morning, 1);

    expect(nextMorning.getHours()).toBe(8);
    expect(nextMorning.getMinutes()).toBe(30);
  });

  it('lands on the next calendar day even from just after midnight', () => {
    /*
     * The case that makes this function exist. Adding 24 hours to 00:30 on the
     * night the clocks go back lands at 23:30 on the same day; moving the
     * calendar lands on the next one, which is what "tomorrow" means.
     */
    const justAfterMidnight = new Date(2026, 9, 25, 0, 30);

    expect(formatIsoDate(addLocalDays(justAfterMidnight, 1))).toBe('2026-10-26');
  });

  it('does not modify the date it was given', () => {
    const original = new Date(2026, 0, 30);
    addLocalDays(original, 5);

    expect(formatIsoDate(original)).toBe('2026-01-30');
  });
});

describe('isSameLocalDay', () => {
  it('is true for two times on one day', () => {
    expect(isSameLocalDay(new Date(2026, 3, 6, 0, 1), new Date(2026, 3, 6, 23, 59))).toBe(true);
  });

  it('is false two minutes either side of midnight', () => {
    expect(isSameLocalDay(new Date(2026, 3, 6, 23, 59), new Date(2026, 3, 7, 0, 1))).toBe(false);
  });
});

describe('countCalendarDaysBetween', () => {
  it('counts one day across a two-hour gap that crosses midnight', () => {
    const mondayNight = new Date(2026, 3, 6, 23, 0);
    const tuesdayMorning = new Date(2026, 3, 7, 1, 0);

    expect(countCalendarDaysBetween(mondayNight, tuesdayMorning)).toBe(1);
  });

  it('counts zero across a twenty-three hour gap inside one day', () => {
    const earlyMorning = new Date(2026, 3, 6, 0, 30);
    const lateEvening = new Date(2026, 3, 6, 23, 30);

    expect(countCalendarDaysBetween(earlyMorning, lateEvening)).toBe(0);
  });

  it('is negative when the days are the wrong way round', () => {
    expect(countCalendarDaysBetween(new Date(2026, 3, 10), new Date(2026, 3, 7))).toBe(-3);
  });

  it('counts a week as seven', () => {
    expect(countCalendarDaysBetween(new Date(2026, 3, 6, 9, 0), new Date(2026, 3, 13, 18, 0))).toBe(
      7,
    );
  });
});

describe('startOfLocalWeek', () => {
  it('winds a Thursday back to the Monday when weeks start on Monday', () => {
    // 2026-04-09 is a Thursday.
    const weekStart = startOfLocalWeek(new Date(2026, 3, 9, 14, 0), 1);

    expect(formatIsoDate(weekStart)).toBe('2026-04-06');
    expect(weekStart.getHours()).toBe(0);
  });

  it('treats Sunday as the end of a Monday-first week, not the start', () => {
    // 2026-04-12 is a Sunday.
    expect(formatIsoDate(startOfLocalWeek(new Date(2026, 3, 12), 1))).toBe('2026-04-06');
  });

  it('returns the day itself when it is already the first day of the week', () => {
    expect(formatIsoDate(startOfLocalWeek(new Date(2026, 3, 6, 22, 0), 1))).toBe('2026-04-06');
  });

  it('honours a Sunday-first week', () => {
    expect(formatIsoDate(startOfLocalWeek(new Date(2026, 3, 9), 0))).toBe('2026-04-05');
  });
});
