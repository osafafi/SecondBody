import { describe, expect, it } from 'vitest';

import { describeDaysAway, describeSessionsCompleted, formatShortDate } from './scheduleWording';

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
