import { describe, expect, it } from 'vitest';

import { formatIsoDate } from './calendarDates';
import {
  canStartSessionFromTodayScreen,
  determineDailyTrainingStatus,
  type DailyTrainingStatusInput,
} from './dailyTrainingStatus';

/** Monday, Wednesday, Friday — the programme's default. */
const MONDAY_WEDNESDAY_FRIDAY = [1, 3, 5];

/*
 * Every date below is in April 2026, where the 6th is a Monday. Writing the
 * weekday into the constant name is what stops a test that passes for the wrong
 * reason after someone edits a date.
 */
const MONDAY_6TH = (hour: number) => new Date(2026, 3, 6, hour, 0);
const TUESDAY_7TH = (hour: number) => new Date(2026, 3, 7, hour, 0);
const WEDNESDAY_8TH = (hour: number) => new Date(2026, 3, 8, hour, 0);
const THURSDAY_9TH = (hour: number) => new Date(2026, 3, 9, hour, 0);
const SATURDAY_11TH = (hour: number) => new Date(2026, 3, 11, hour, 0);

function buildInput(overrides: Partial<DailyTrainingStatusInput> = {}): DailyTrainingStatusInput {
  return {
    now: MONDAY_6TH(18),
    trainingDaysOfWeek: MONDAY_WEDNESDAY_FRIDAY,
    lastCompletedSessionAt: null,
    minimumHoursBetweenSessions: 48,
    hasSessionInProgress: false,
    isProgrammeFinished: false,
    ...overrides,
  };
}

describe('determineDailyTrainingStatus stances', () => {
  it('is ready to train on a training day with nothing behind it', () => {
    const status = determineDailyTrainingStatus(buildInput());

    expect(status.stance).toBe('readyToTrain');
    expect(status.isAllowedToStartNow).toBe(true);
    expect(status.daysSinceLastSession).toBeNull();
  });

  it('is a rest day on a Tuesday, and still allows a session', () => {
    const status = determineDailyTrainingStatus(buildInput({ now: TUESDAY_7TH(18) }));

    expect(status.stance).toBe('restDay');
    expect(status.isTrainingDay).toBe(false);

    // The weekday is a plan, not a rail. A missed Monday is trained on Tuesday.
    expect(status.isAllowedToStartNow).toBe(true);
    expect(canStartSessionFromTodayScreen(status)).toBe(true);
  });

  it('is recovering inside the 48 hours, on a training day', () => {
    const status = determineDailyTrainingStatus(
      buildInput({ now: WEDNESDAY_8TH(8), lastCompletedSessionAt: MONDAY_6TH(19) }),
    );

    expect(status.stance).toBe('recovering');
    expect(status.isTrainingDay).toBe(true);
    expect(status.isAllowedToStartNow).toBe(false);
    expect(status.hoursUntilAllowed).toBe(11);
    expect(canStartSessionFromTodayScreen(status)).toBe(false);
  });

  it('says he trained today rather than counting the hours left', () => {
    const status = determineDailyTrainingStatus(
      buildInput({ now: MONDAY_6TH(21), lastCompletedSessionAt: MONDAY_6TH(19) }),
    );

    // Both are true of this moment. The one worth reading is the first.
    expect(status.stance).toBe('trainedToday');
    expect(status.hasTrainedToday).toBe(true);
    expect(status.isAllowedToStartNow).toBe(false);
  });

  it('does not call yesterday evening "today" just because it was recent', () => {
    const status = determineDailyTrainingStatus(
      buildInput({ now: TUESDAY_7TH(1), lastCompletedSessionAt: MONDAY_6TH(23) }),
    );

    expect(status.hasTrainedToday).toBe(false);
    expect(status.stance).toBe('recovering');
  });

  it('lets an unfinished session outrank everything else', () => {
    const status = determineDailyTrainingStatus(
      buildInput({
        now: MONDAY_6TH(20),
        lastCompletedSessionAt: MONDAY_6TH(19),
        hasSessionInProgress: true,
        isProgrammeFinished: true,
      }),
    );

    expect(status.stance).toBe('sessionInProgress');
    expect(canStartSessionFromTodayScreen(status)).toBe(true);
  });

  it('reports a finished programme once nothing is in progress', () => {
    const status = determineDailyTrainingStatus(buildInput({ isProgrammeFinished: true }));

    expect(status.stance).toBe('programmeFinished');
    expect(canStartSessionFromTodayScreen(status)).toBe(false);
  });

  it('is ready again exactly 48 hours after the last session', () => {
    const status = determineDailyTrainingStatus(
      buildInput({ now: WEDNESDAY_8TH(19), lastCompletedSessionAt: MONDAY_6TH(19) }),
    );

    expect(status.stance).toBe('readyToTrain');
    expect(status.hoursUntilAllowed).toBe(0);
  });
});

describe('determineDailyTrainingStatus rail arithmetic', () => {
  it('names the moment the rail lifts', () => {
    const status = determineDailyTrainingStatus(
      buildInput({ now: TUESDAY_7TH(9), lastCompletedSessionAt: MONDAY_6TH(19) }),
    );

    expect(status.earliestNextSessionAt).not.toBeNull();
    expect(formatIsoDate(status.earliestNextSessionAt as Date)).toBe('2026-04-08');
    expect((status.earliestNextSessionAt as Date).getHours()).toBe(19);
  });

  it('leaves the moment null when the rail is not holding anything back', () => {
    const status = determineDailyTrainingStatus(
      buildInput({ now: THURSDAY_9TH(9), lastCompletedSessionAt: MONDAY_6TH(19) }),
    );

    expect(status.earliestNextSessionAt).toBeNull();
  });
});

describe('determineDailyTrainingStatus days since the last session', () => {
  it('counts calendar days rather than elapsed 24-hour periods', () => {
    /*
     * Monday evening to Thursday morning is 62 hours — two whole 24-hour
     * periods — and three days ago. Three is what gets said out loud, and it is
     * the one that agrees with the calendar he is looking at.
     */
    const status = determineDailyTrainingStatus(
      buildInput({ now: THURSDAY_9TH(9), lastCompletedSessionAt: MONDAY_6TH(19) }),
    );

    expect(status.daysSinceLastSession).toBe(3);
  });

  it('calls last night yesterday, not today', () => {
    // 23.5 hours ago, and unambiguously yesterday.
    const status = determineDailyTrainingStatus(
      buildInput({ now: WEDNESDAY_8TH(18), lastCompletedSessionAt: TUESDAY_7TH(19) }),
    );

    expect(status.daysSinceLastSession).toBe(1);
    expect(status.hasTrainedToday).toBe(false);
  });

  it('is zero for a session earlier the same day', () => {
    const status = determineDailyTrainingStatus(
      buildInput({ now: WEDNESDAY_8TH(21), lastCompletedSessionAt: WEDNESDAY_8TH(7) }),
    );

    expect(status.daysSinceLastSession).toBe(0);
    expect(status.hasTrainedToday).toBe(true);
  });

  it('is null before there has ever been a session', () => {
    expect(determineDailyTrainingStatus(buildInput()).daysSinceLastSession).toBeNull();
  });
});

describe('determineDailyTrainingStatus next available training date', () => {
  it('is today when today is a clear training day', () => {
    const status = determineDailyTrainingStatus(buildInput({ now: MONDAY_6TH(18) }));

    expect(formatIsoDate(status.nextAvailableTrainingDate as Date)).toBe('2026-04-06');
  });

  it('is still today when the rail lifts later the same evening', () => {
    /*
     * Wednesday morning, 11 hours short of the rail. Wednesday is not
     * disqualified by that — Wednesday evening is exactly when he trains.
     */
    const status = determineDailyTrainingStatus(
      buildInput({ now: WEDNESDAY_8TH(8), lastCompletedSessionAt: MONDAY_6TH(19) }),
    );

    expect(formatIsoDate(status.nextAvailableTrainingDate as Date)).toBe('2026-04-08');
  });

  it('skips past a training day the rail has taken out', () => {
    // Trained Tuesday evening, so Wednesday is inside the 48 hours entirely.
    const status = determineDailyTrainingStatus(
      buildInput({ now: TUESDAY_7TH(21), lastCompletedSessionAt: TUESDAY_7TH(20) }),
    );

    expect(formatIsoDate(status.nextAvailableTrainingDate as Date)).toBe('2026-04-10');
  });

  it('rolls into the following week from a Saturday', () => {
    const status = determineDailyTrainingStatus(buildInput({ now: SATURDAY_11TH(11) }));

    expect(status.stance).toBe('restDay');
    expect(formatIsoDate(status.nextAvailableTrainingDate as Date)).toBe('2026-04-13');
  });

  it('is null when the profile has no training days at all', () => {
    const status = determineDailyTrainingStatus(buildInput({ trainingDaysOfWeek: [] }));

    expect(status.nextAvailableTrainingDate).toBeNull();

    // No scheduled day does not mean no session. The rail is still the only gate.
    expect(status.stance).toBe('restDay');
    expect(canStartSessionFromTodayScreen(status)).toBe(true);
  });
});
