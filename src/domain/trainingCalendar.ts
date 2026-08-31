import type { WorkoutSession } from '@/types/trainingHistoryTypes';
import { SESSION_LETTERS, type SessionLetter } from '@/types/trainingVocabulary';

import {
  addLocalDays,
  formatIsoDate,
  isSameLocalDay,
  startOfLocalDay,
  startOfLocalWeek,
} from './calendarDates';

/**
 * The grid on the Schedule screen: which days were trained, which are planned,
 * and which were planned and missed.
 *
 * Three of the four kinds of day are facts. The fourth — a *planned* session —
 * is a projection, and the rules behind it are the reason this is a tested
 * function rather than a loop inside a component:
 *
 * - **The letter cycle does not follow the weekday.** Sessions go A, B, C, A,
 *   and the cycle only moves when one is completed. A missed Wednesday means
 *   Friday trains what Wednesday would have, so the projection walks forward
 *   through the planned days handing out letters in order rather than assigning
 *   them by day of the week.
 * - **A missed day is never given a letter.** We know a session did not happen;
 *   we do not know which one it would have been, because the cycle had not moved
 *   on. Guessing would put a letter on the grid that is contradicted by the next
 *   day along.
 * - **Nothing before the programme started can be missed.** Otherwise a new
 *   account opens the Schedule screen to a wall of failures it had no way to
 *   avoid.
 */

const DAYS_PER_WEEK = 7;

export const TRAINING_CALENDAR_DAY_KINDS = [
  /** A session was completed on this day. */
  'completedSession',

  /** A session was started on this day and never finished. */
  'unfinishedSession',

  /** A training day still to come, or today before it has been trained. */
  'plannedSession',

  /** A training day in the past with nothing recorded against it. */
  'missedSession',

  /** Not a training day. */
  'restDay',
] as const;

export type TrainingCalendarDayKind = (typeof TRAINING_CALENDAR_DAY_KINDS)[number];

export type TrainingCalendarDay = {
  date: Date;

  /** ISO `YYYY-MM-DD`. The key the grid is built on. */
  isoDate: string;

  kind: TrainingCalendarDayKind;

  isToday: boolean;

  /** True for days before the programme began. Never counted as missed. */
  isBeforeProgrammeStart: boolean;

  /**
   * The session trained that day, or projected for a planned day.
   *
   * Null on rest days, and null on missed days — see the note at the top about
   * why a missed day is not given a guess.
   */
  sessionLetter: SessionLetter | null;

  /** The programme week the completed session belonged to. Null otherwise. */
  weekNumber: number | null;
};

export type TrainingCalendarWeek = {
  /** Midnight on the first day of the row. */
  startDate: Date;

  /** Exactly seven, in calendar order. */
  days: TrainingCalendarDay[];
};

export type TrainingCalendarInput = {
  now: Date;

  /** How many whole weeks of history to show before the week containing today. */
  weeksBeforeToday: number;

  /** How many whole weeks to project past the week containing today. */
  weeksAfterToday: number;

  /** `Date.getDay()` numbering. The Schedule screen passes 1, for Monday. */
  firstDayOfWeek: number;

  /** From the profile. 0 is Sunday. */
  trainingDaysOfWeek: number[];

  /** Every session read back, in any order and of any status. */
  recentSessions: readonly WorkoutSession[];

  /** What the assignment says comes next. The projection starts from this. */
  nextSessionLetter: SessionLetter;

  /** ISO date the programme began, or null when it has not started yet. */
  programmeStartedOn: string | null;
};

type SessionOnADay = {
  session: WorkoutSession;
  isCompleted: boolean;
};

/**
 * The session that happened on each day, keyed by ISO date.
 *
 * A completed session always beats an unfinished one on the same day: an
 * abandoned attempt followed by a real session is a day he trained.
 */
function indexSessionsByDay(recentSessions: readonly WorkoutSession[]): Map<string, SessionOnADay> {
  const sessionsByDay = new Map<string, SessionOnADay>();

  for (const session of recentSessions) {
    if (session.status === 'abandoned') {
      continue;
    }

    const isCompleted = session.status === 'completed';

    // A completed session is filed under the day it finished; an unfinished one
    // has no finish, so it is filed under the day it began.
    const dayInstant = isCompleted ? (session.completedAt ?? session.startedAt) : session.startedAt;
    const isoDate = formatIsoDate(dayInstant);

    const existingSession = sessionsByDay.get(isoDate);

    if (existingSession && existingSession.isCompleted && !isCompleted) {
      continue;
    }

    sessionsByDay.set(isoDate, { session, isCompleted });
  }

  return sessionsByDay;
}

/** A, B, C, A, ... starting from whatever the assignment says is next. */
function buildSessionLetterCycle(startingLetter: SessionLetter): () => SessionLetter {
  let nextIndex = Math.max(0, SESSION_LETTERS.indexOf(startingLetter));

  return () => {
    const letter = SESSION_LETTERS[nextIndex % SESSION_LETTERS.length];
    nextIndex += 1;

    /*
     * SESSION_LETTERS is a non-empty const tuple and the index is taken modulo
     * its length, so this cannot be undefined. The check is here to satisfy
     * noUncheckedIndexedAccess without an assertion.
     */
    return letter ?? 'A';
  };
}

/**
 * The calendar, as rows of seven days.
 *
 * Days are walked in ascending order for one reason that matters: the letter
 * projection is a running cycle, so a planned Friday can only be worked out
 * after the planned Wednesday before it has taken its letter.
 */
export function buildTrainingCalendar(input: TrainingCalendarInput): TrainingCalendarWeek[] {
  const {
    now,
    weeksBeforeToday,
    weeksAfterToday,
    firstDayOfWeek,
    trainingDaysOfWeek,
    recentSessions,
    nextSessionLetter,
    programmeStartedOn,
  } = input;

  const sessionsByDay = indexSessionsByDay(recentSessions);
  const takeNextPlannedLetter = buildSessionLetterCycle(nextSessionLetter);

  const weekContainingToday = startOfLocalWeek(now, firstDayOfWeek);
  const firstDayOfCalendar = addLocalDays(weekContainingToday, -weeksBeforeToday * DAYS_PER_WEEK);
  const weekCount = weeksBeforeToday + 1 + weeksAfterToday;

  const startOfToday = startOfLocalDay(now);

  const weeks: TrainingCalendarWeek[] = [];

  for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
    const weekStartDate = addLocalDays(firstDayOfCalendar, weekIndex * DAYS_PER_WEEK);
    const days: TrainingCalendarDay[] = [];

    for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex += 1) {
      const date = addLocalDays(weekStartDate, dayIndex);
      const isoDate = formatIsoDate(date);

      const isToday = isSameLocalDay(date, now);
      const isInThePast = startOfLocalDay(date).getTime() < startOfToday.getTime();
      const isBeforeProgrammeStart =
        programmeStartedOn === null ? true : isoDate < programmeStartedOn;

      const sessionOnThisDay = sessionsByDay.get(isoDate);

      if (sessionOnThisDay) {
        days.push({
          date,
          isoDate,
          kind: sessionOnThisDay.isCompleted ? 'completedSession' : 'unfinishedSession',
          isToday,
          isBeforeProgrammeStart,
          sessionLetter: sessionOnThisDay.session.sessionLetter,
          weekNumber: sessionOnThisDay.session.weekNumber,
        });

        continue;
      }

      if (!trainingDaysOfWeek.includes(date.getDay())) {
        days.push({
          date,
          isoDate,
          kind: 'restDay',
          isToday,
          isBeforeProgrammeStart,
          sessionLetter: null,
          weekNumber: null,
        });

        continue;
      }

      /*
       * A training day in the past that the programme had not started on yet is
       * not a failure and is not a plan either. It is simply a day, which is
       * what a rest day is here.
       */
      const pastDayKind: TrainingCalendarDayKind = isBeforeProgrammeStart
        ? 'restDay'
        : 'missedSession';

      days.push({
        date,
        isoDate,
        kind: isInThePast ? pastDayKind : 'plannedSession',
        isToday,
        isBeforeProgrammeStart,
        /*
         * Only days still to come take a letter from the cycle. A past training
         * day gets nothing — see the note at the top — and taking a letter for
         * it would shift every future day along by one.
         */
        sessionLetter: isInThePast ? null : takeNextPlannedLetter(),
        weekNumber: null,
      });
    }

    weeks.push({ startDate: weekStartDate, days });
  }

  return weeks;
}

/** Every day in the calendar, flattened. Useful for counting. */
export function flattenTrainingCalendar(
  weeks: readonly TrainingCalendarWeek[],
): TrainingCalendarDay[] {
  return weeks.flatMap((week) => week.days);
}

/**
 * How many planned training days went by without a session.
 *
 * Counted over whatever range the calendar covers, which is what makes it a
 * fair reading of "recently" rather than an all-time tally somebody would have
 * to live down.
 */
export function countMissedTrainingDays(weeks: readonly TrainingCalendarWeek[]): number {
  return flattenTrainingCalendar(weeks).filter((day) => day.kind === 'missedSession').length;
}

export type UpcomingTrainingDay = {
  date: Date;
  sessionLetter: SessionLetter;
  isToday: boolean;
};

/**
 * The next few training days, for the list under the grid.
 *
 * Today counts as upcoming while it is still a planned day — it stops being one
 * the moment a session is filed against it, at which point the list moves on to
 * Wednesday on its own.
 */
export function findUpcomingTrainingDays(
  weeks: readonly TrainingCalendarWeek[],
  maximumCount: number,
): UpcomingTrainingDay[] {
  const upcomingDays: UpcomingTrainingDay[] = [];

  for (const day of flattenTrainingCalendar(weeks)) {
    if (upcomingDays.length >= maximumCount) {
      break;
    }

    if (day.kind === 'plannedSession' && day.sessionLetter) {
      upcomingDays.push({
        date: day.date,
        sessionLetter: day.sessionLetter,
        isToday: day.isToday,
      });
    }
  }

  return upcomingDays;
}
