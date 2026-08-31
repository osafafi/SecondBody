/**
 * When the next session is allowed to happen.
 *
 * Every function here takes the current time as an argument rather than reading
 * a clock. That is what makes "what happens at 23:59 on a Sunday" a test rather
 * than a thing someone finds out in a gym.
 *
 * The rail being enforced is the first one in docs/TRAINING_PROGRAM.md
 * section 12: never two strength sessions less than 48 hours apart.
 */

import { addLocalDays } from './calendarDates';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
const DAYS_PER_WEEK = 7;

/** Hours from the earlier moment to the later one. Negative if they are the wrong way round. */
export function calculateHoursBetween(earlierMoment: Date, laterMoment: Date): number {
  return (laterMoment.getTime() - earlierMoment.getTime()) / MILLISECONDS_PER_HOUR;
}

/** Whole days between two moments, rounded down. */
export function calculateWholeDaysBetween(earlierMoment: Date, laterMoment: Date): number {
  return Math.floor((laterMoment.getTime() - earlierMoment.getTime()) / MILLISECONDS_PER_DAY);
}

export type SessionStartEligibility = {
  isAllowedToStartNow: boolean;

  /** 0 when a session can start now. Otherwise how much longer to wait. */
  hoursUntilAllowed: number;
};

export type SessionStartEligibilityInput = {
  now: Date;

  /** Null when no strength session has ever been completed. */
  lastCompletedSessionAt: Date | null;

  minimumHoursBetweenSessions: number;
};

/**
 * Whether a strength session can start, given when the last one finished.
 *
 * The 48 hours are counted from the end of the previous session, not from its
 * start, because recovery starts when the work stops.
 */
export function determineSessionStartEligibility(
  input: SessionStartEligibilityInput,
): SessionStartEligibility {
  const { now, lastCompletedSessionAt, minimumHoursBetweenSessions } = input;

  if (lastCompletedSessionAt === null) {
    return { isAllowedToStartNow: true, hoursUntilAllowed: 0 };
  }

  const hoursSinceLastSession = calculateHoursBetween(lastCompletedSessionAt, now);

  if (hoursSinceLastSession >= minimumHoursBetweenSessions) {
    return { isAllowedToStartNow: true, hoursUntilAllowed: 0 };
  }

  return {
    isAllowedToStartNow: false,
    hoursUntilAllowed: Math.round((minimumHoursBetweenSessions - hoursSinceLastSession) * 10) / 10,
  };
}

/**
 * The next date on or after `fromDate` that falls on a training day.
 *
 * Day numbers are JavaScript's: 0 is Sunday. The returned date keeps the time of
 * day it was given, because callers use it for display rather than for a
 * countdown.
 *
 * The walk moves whole calendar days rather than adding 24 hours — see the note
 * at the top of `calendarDates.ts`. Adding 24 hours to a time just after
 * midnight on the night the clocks go back lands on the same day again, which
 * would make this return today when today is not a training day.
 */
export function findNextTrainingDate(fromDate: Date, trainingDaysOfWeek: number[]): Date | null {
  if (trainingDaysOfWeek.length === 0) {
    return null;
  }

  for (let dayOffset = 0; dayOffset < DAYS_PER_WEEK; dayOffset += 1) {
    const candidateDate = addLocalDays(fromDate, dayOffset);

    if (trainingDaysOfWeek.includes(candidateDate.getDay())) {
      return candidateDate;
    }
  }

  // Unreachable while the list holds any day 0-6, but a caller could pass [9].
  return null;
}

/** True when this date is one of the programme's training days. */
export function isTrainingDay(date: Date, trainingDaysOfWeek: number[]): boolean {
  return trainingDaysOfWeek.includes(date.getDay());
}

/**
 * True when a session that started at this hour counts as a morning session and
 * gets the longer warm-up.
 */
export function isMorningSession(
  sessionStartHourOfDay: number,
  morningCutoffHour: number,
): boolean {
  return sessionStartHourOfDay < morningCutoffHour;
}
