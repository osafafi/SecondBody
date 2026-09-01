import { describe, expect, it } from 'vitest';

import {
  describeDaysAway,
  describeSessionsCompleted,
  describeWeekMonth,
  formatShortDate,
} from './scheduleWording';

/* April 2026: the 6th is a Monday. */
const WEDNESDAY_8TH_EVENING = new Date(2026, 3, 8, 19, 0);

describe('describeDaysAway', () => {
  it('calls today today, whatever the time of day', () => {
    expect(describeDaysAway(new Date(2026, 3, 8, 6, 0), WEDNESDAY_8TH_EVENING)).toBe('today');
  });

  it('counts calendar days rather than elapsed hours', () => {
    /*
     * Tomorrow morning is thirteen hours away and still tomorrow. Counting
     * 24-hour periods would call it today, on the screen showing the date
     * beside it.
     */
    expect(describeDaysAway(new Date(2026, 3, 9, 8, 0), WEDNESDAY_8TH_EVENING)).toBe('tomorrow');
  });

  it('counts further days out', () => {
    expect(describeDaysAway(new Date(2026, 3, 13, 18, 0), WEDNESDAY_8TH_EVENING)).toBe('in 5 days');
  });
});

describe('formatShortDate', () => {
  it('names the weekday and the date', () => {
    const label = formatShortDate(new Date(2026, 3, 8));

    expect(label).toContain('Wed');
    expect(label).toContain('8');
    expect(label).toContain('Apr');
  });
});

describe('describeSessionsCompleted', () => {
  it('reads as a fraction of the whole programme', () => {
    expect(describeSessionsCompleted(9, 36)).toBe('9 of 36 sessions');
  });
});

describe('describeWeekMonth', () => {
  /** Seven consecutive days from a Monday, the way the grid builds a row. */
  function buildWeekRow(firstDay: Date): Date[] {
    return Array.from(
      { length: 7 },
      (_unused, dayIndex) =>
        new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + dayIndex),
    );
  }

  it('names the month of a row that sits inside one', () => {
    expect(describeWeekMonth(buildWeekRow(new Date(2026, 3, 6)))).toBe('April 2026');
  });

  it('gives a straddling row to the month holding most of it', () => {
    /*
     * Monday 31 August to Sunday 6 September is one day of August and six of
     * September. Reading the row's first day would file it under August and put
     * the heading a week out for the first six days of the month.
     */
    expect(describeWeekMonth(buildWeekRow(new Date(2026, 7, 31)))).toBe('September 2026');

    /*
     * And the other way. Monday 28 September to Sunday 4 October is three days
     * of September and four of October, so the row is October's — which is what
     * "most of it" means, even though the row opens in September.
     */
    expect(describeWeekMonth(buildWeekRow(new Date(2026, 8, 28)))).toBe('October 2026');
  });

  it('carries the year, so a row in January is not confused with the last one', () => {
    expect(describeWeekMonth(buildWeekRow(new Date(2026, 11, 28)))).toBe('December 2026');
    expect(describeWeekMonth(buildWeekRow(new Date(2027, 0, 4)))).toBe('January 2027');
  });

  it('has something to say about an empty row rather than throwing', () => {
    expect(describeWeekMonth([])).toBe('');
  });
});
