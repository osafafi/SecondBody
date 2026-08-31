import { describe, expect, it } from 'vitest';

import { buildWorkoutSession } from '@/test/trainingTestFactories';
import type { WorkoutSession } from '@/types/trainingHistoryTypes';

import { formatIsoDate } from './calendarDates';
import {
  buildTrainingCalendar,
  countMissedTrainingDays,
  findUpcomingTrainingDays,
  flattenTrainingCalendar,
  type TrainingCalendarDay,
  type TrainingCalendarInput,
} from './trainingCalendar';

/*
 * April 2026. The 6th is a Monday, so a Monday-first calendar row runs 6th to
 * 12th and the training days in it are the 6th, 8th and 10th.
 */
const WEDNESDAY_8TH_EVENING = new Date(2026, 3, 8, 19, 0);

const MONDAY_WEDNESDAY_FRIDAY = [1, 3, 5];

function buildInput(overrides: Partial<TrainingCalendarInput> = {}): TrainingCalendarInput {
  return {
    now: WEDNESDAY_8TH_EVENING,
    weeksBeforeToday: 0,
    weeksAfterToday: 0,
    firstDayOfWeek: 1,
    trainingDaysOfWeek: MONDAY_WEDNESDAY_FRIDAY,
    recentSessions: [],
    nextSessionLetter: 'B',
    programmeStartedOn: '2026-04-06',
    ...overrides,
  };
}

/** A completed session on a given day of April 2026. */
function buildSessionOn(dayOfMonth: number, overrides: Partial<WorkoutSession> = {}) {
  return buildWorkoutSession({
    startedAt: new Date(2026, 3, dayOfMonth, 18, 0),
    completedAt: new Date(2026, 3, dayOfMonth, 19, 0),
    ...overrides,
  });
}

function findDay(days: TrainingCalendarDay[], isoDate: string): TrainingCalendarDay {
  const day = days.find((candidate) => candidate.isoDate === isoDate);

  if (!day) {
    throw new Error(`The calendar does not cover ${isoDate}.`);
  }

  return day;
}

describe('buildTrainingCalendar shape', () => {
  it('returns whole weeks of seven days each', () => {
    const weeks = buildTrainingCalendar(buildInput({ weeksBeforeToday: 2, weeksAfterToday: 1 }));

    expect(weeks).toHaveLength(4);
    for (const week of weeks) {
      expect(week.days).toHaveLength(7);
    }
  });

  it('starts each row on the requested first day of the week', () => {
    const weeks = buildTrainingCalendar(buildInput());
    const firstWeek = weeks[0];

    expect(formatIsoDate(firstWeek?.startDate as Date)).toBe('2026-04-06');
    expect(formatIsoDate(firstWeek?.days[0]?.date as Date)).toBe('2026-04-06');
    expect(formatIsoDate(firstWeek?.days[6]?.date as Date)).toBe('2026-04-12');
  });

  it('reaches back the requested number of whole weeks', () => {
    const weeks = buildTrainingCalendar(buildInput({ weeksBeforeToday: 2 }));

    expect(formatIsoDate(weeks[0]?.startDate as Date)).toBe('2026-03-23');
  });

  it('marks exactly one day as today', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(buildInput({ weeksBeforeToday: 1, weeksAfterToday: 1 })),
    );

    expect(days.filter((day) => day.isToday).map((day) => day.isoDate)).toEqual(['2026-04-08']);
  });
});

describe('buildTrainingCalendar day kinds', () => {
  it('marks a day with a completed session, carrying its letter and week', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(
        buildInput({ recentSessions: [buildSessionOn(6, { sessionLetter: 'A', weekNumber: 1 })] }),
      ),
    );

    const monday = findDay(days, '2026-04-06');

    expect(monday.kind).toBe('completedSession');
    expect(monday.sessionLetter).toBe('A');
    expect(monday.weekNumber).toBe(1);
  });

  it('marks a past training day with nothing against it as missed', () => {
    const days = flattenTrainingCalendar(buildTrainingCalendar(buildInput()));

    expect(findDay(days, '2026-04-06').kind).toBe('missedSession');
  });

  it('never gives a missed day a projected letter', () => {
    const days = flattenTrainingCalendar(buildTrainingCalendar(buildInput()));

    expect(findDay(days, '2026-04-06').sessionLetter).toBeNull();
  });

  it('does not call days before the programme started missed', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(buildInput({ weeksBeforeToday: 1, programmeStartedOn: '2026-04-06' })),
    );

    // 2026-04-01 is a Wednesday, a week before the programme began.
    const wednesdayBefore = findDay(days, '2026-04-01');

    expect(wednesdayBefore.kind).toBe('restDay');
    expect(wednesdayBefore.isBeforeProgrammeStart).toBe(true);
  });

  it('treats every past day as before the start when the programme has not begun', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(buildInput({ programmeStartedOn: null })),
    );

    expect(findDay(days, '2026-04-06').kind).toBe('restDay');
    expect(
      countMissedTrainingDays(buildTrainingCalendar(buildInput({ programmeStartedOn: null }))),
    ).toBe(0);
  });

  it('marks days that are not training days as rest days', () => {
    const days = flattenTrainingCalendar(buildTrainingCalendar(buildInput()));

    expect(findDay(days, '2026-04-07').kind).toBe('restDay');
    expect(findDay(days, '2026-04-11').kind).toBe('restDay');
  });

  it('marks a session that was started and never finished', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(
        buildInput({
          recentSessions: [buildSessionOn(6, { status: 'inProgress', completedAt: null })],
        }),
      ),
    );

    expect(findDay(days, '2026-04-06').kind).toBe('unfinishedSession');
  });

  it('ignores abandoned sessions, so the day reads as missed', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(
        buildInput({
          recentSessions: [buildSessionOn(6, { status: 'abandoned', completedAt: null })],
        }),
      ),
    );

    expect(findDay(days, '2026-04-06').kind).toBe('missedSession');
  });

  it('lets a completed session win over an abandoned attempt on the same day', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(
        buildInput({
          recentSessions: [
            buildSessionOn(6, { status: 'inProgress', completedAt: null }),
            buildSessionOn(6, { sessionLetter: 'A' }),
          ],
        }),
      ),
    );

    expect(findDay(days, '2026-04-06').kind).toBe('completedSession');
  });

  it('files a session by the day it finished, not the day it started', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(
        buildInput({
          recentSessions: [
            buildWorkoutSession({
              startedAt: new Date(2026, 3, 6, 23, 30),
              completedAt: new Date(2026, 3, 7, 0, 40),
            }),
          ],
        }),
      ),
    );

    expect(findDay(days, '2026-04-07').kind).toBe('completedSession');
    expect(findDay(days, '2026-04-06').kind).toBe('missedSession');
  });
});

describe('buildTrainingCalendar letter projection', () => {
  it('starts today on the letter the assignment says is next', () => {
    const days = flattenTrainingCalendar(buildTrainingCalendar(buildInput()));

    expect(findDay(days, '2026-04-08').kind).toBe('plannedSession');
    expect(findDay(days, '2026-04-08').sessionLetter).toBe('B');
  });

  it('cycles A, B, C forward across the planned days', () => {
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(buildInput({ weeksAfterToday: 1, nextSessionLetter: 'B' })),
    );

    expect(findDay(days, '2026-04-08').sessionLetter).toBe('B');
    expect(findDay(days, '2026-04-10').sessionLetter).toBe('C');
    expect(findDay(days, '2026-04-13').sessionLetter).toBe('A');
    expect(findDay(days, '2026-04-15').sessionLetter).toBe('B');
  });

  it('does not spend a letter on today once today has been trained', () => {
    /*
     * The cycle only moves when a session is completed. A session filed against
     * today means the assignment has already moved on, so Friday takes the
     * letter today would have.
     */
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(
        buildInput({
          recentSessions: [buildSessionOn(8, { sessionLetter: 'B' })],
          nextSessionLetter: 'C',
        }),
      ),
    );

    expect(findDay(days, '2026-04-08').kind).toBe('completedSession');
    expect(findDay(days, '2026-04-10').sessionLetter).toBe('C');
  });

  it('does not let a missed Monday shift the letters along', () => {
    // Monday was missed, so Wednesday trains what Monday would have.
    const days = flattenTrainingCalendar(
      buildTrainingCalendar(buildInput({ nextSessionLetter: 'A' })),
    );

    expect(findDay(days, '2026-04-06').kind).toBe('missedSession');
    expect(findDay(days, '2026-04-08').sessionLetter).toBe('A');
    expect(findDay(days, '2026-04-10').sessionLetter).toBe('B');
  });
});

describe('countMissedTrainingDays', () => {
  it('counts only the missed days inside the range shown', () => {
    const mondayThirtiethOfMarch = buildWorkoutSession({
      startedAt: new Date(2026, 2, 30, 18, 0),
      completedAt: new Date(2026, 2, 30, 19, 0),
      sessionLetter: 'A',
    });

    const weeks = buildTrainingCalendar(
      buildInput({
        weeksBeforeToday: 1,
        programmeStartedOn: '2026-03-30',
        recentSessions: [mondayThirtiethOfMarch],
      }),
    );

    // Trained 30 Mar. Missed 1, 3 and 6 Apr. Today, 8 Apr, is still to be played.
    expect(countMissedTrainingDays(weeks)).toBe(3);
  });

  it('is zero when every planned day was trained', () => {
    const weeks = buildTrainingCalendar(
      buildInput({
        recentSessions: [buildSessionOn(6, { sessionLetter: 'A' })],
      }),
    );

    expect(countMissedTrainingDays(weeks)).toBe(0);
  });
});

describe('findUpcomingTrainingDays', () => {
  it('lists the next planned days in order, with their letters', () => {
    const weeks = buildTrainingCalendar(buildInput({ weeksAfterToday: 1, nextSessionLetter: 'B' }));
    const upcomingDays = findUpcomingTrainingDays(weeks, 3);

    expect(upcomingDays.map((day) => formatIsoDate(day.date))).toEqual([
      '2026-04-08',
      '2026-04-10',
      '2026-04-13',
    ]);
    expect(upcomingDays.map((day) => day.sessionLetter)).toEqual(['B', 'C', 'A']);
  });

  it('marks today as today while it is still unplayed', () => {
    const weeks = buildTrainingCalendar(buildInput({ weeksAfterToday: 1 }));

    expect(findUpcomingTrainingDays(weeks, 1)[0]?.isToday).toBe(true);
  });

  it('moves on to the next day once today has been trained', () => {
    const weeks = buildTrainingCalendar(
      buildInput({
        weeksAfterToday: 1,
        recentSessions: [buildSessionOn(8, { sessionLetter: 'B' })],
        nextSessionLetter: 'C',
      }),
    );

    const firstUpcomingDay = findUpcomingTrainingDays(weeks, 1)[0];

    expect(formatIsoDate(firstUpcomingDay?.date as Date)).toBe('2026-04-10');
    expect(firstUpcomingDay?.isToday).toBe(false);
  });

  it('stops at the requested count', () => {
    const weeks = buildTrainingCalendar(buildInput({ weeksAfterToday: 3 }));

    expect(findUpcomingTrainingDays(weeks, 2)).toHaveLength(2);
  });
});
