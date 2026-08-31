import { describe, expect, it } from 'vitest';

import {
  describeDaysSinceLastSession,
  describeMovementCount,
  describeTrainingDay,
  describeWaitUntilAllowed,
} from './todayWording';

/* April 2026: the 6th is a Monday. */
const WEDNESDAY_8TH_EVENING = new Date(2026, 3, 8, 19, 0);

describe('describeTrainingDay', () => {
  it('calls today today', () => {
    expect(describeTrainingDay(new Date(2026, 3, 8, 7, 0), WEDNESDAY_8TH_EVENING)).toBe('today');
  });

  it('calls tomorrow tomorrow, even from late tonight', () => {
    const lateTonight = new Date(2026, 3, 8, 23, 50);

    expect(describeTrainingDay(new Date(2026, 3, 9, 7, 0), lateTonight)).toBe('tomorrow');
  });

  it('names the weekday inside the week', () => {
    expect(describeTrainingDay(new Date(2026, 3, 10), WEDNESDAY_8TH_EVENING)).toBe('Friday');
  });

  it('adds the date once a weekday alone would be ambiguous', () => {
    // Seven days out, where "Wednesday" could mean either one.
    const nextWednesday = describeTrainingDay(new Date(2026, 3, 15), WEDNESDAY_8TH_EVENING);

    expect(nextWednesday).toContain('15');
    expect(nextWednesday).toContain('April');
  });
});

describe('describeWaitUntilAllowed', () => {
  it('never rounds a real wait down to nothing', () => {
    // Eleven minutes left is still a wait, and "in 0 hours" is not an answer.
    expect(describeWaitUntilAllowed(0.18)).toBe('in under an hour');
  });

  it('says now when there is no wait', () => {
    expect(describeWaitUntilAllowed(0)).toBe('now');
  });

  it('rounds up, so the figure never promises earlier than the truth', () => {
    expect(describeWaitUntilAllowed(10.2)).toBe('in 11 hours');
  });

  it('reads as a singular hour when there is one', () => {
    expect(describeWaitUntilAllowed(1)).toBe('in an hour');
  });
});

describe('describeDaysSinceLastSession', () => {
  it('reads naturally at zero, one and more', () => {
    expect(describeDaysSinceLastSession(0)).toBe('today');
    expect(describeDaysSinceLastSession(1)).toBe('yesterday');
    expect(describeDaysSinceLastSession(4)).toBe('4 days ago');
  });
});

describe('describeMovementCount', () => {
  it('does not write "1 movements"', () => {
    expect(describeMovementCount(1)).toBe('1 movement');
    expect(describeMovementCount(6)).toBe('6 movements');
  });
});
