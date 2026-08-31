import { countCalendarDaysBetween, isSameLocalDay } from '@/domain/calendarDates';

/**
 * The labels the Schedule screen uses.
 *
 * Presentation only, and no tone. Harout's copy lives in
 * `src/content/coachVoice/` — nothing here has an opinion about a missed
 * Wednesday, it just writes the date on it.
 */

const WEEKDAY_INITIAL_FORMATTER = new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' });
const SHORT_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const DAY_AND_MONTH_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});
const DATE_AND_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
});

/** "M", "T", "W" — the column headings above the grid. */
export function formatWeekdayInitial(date: Date): string {
  return WEEKDAY_INITIAL_FORMATTER.format(date);
}

/** "Mon 6 Apr" — a row in the upcoming list. */
export function formatShortDate(date: Date): string {
  return `${SHORT_WEEKDAY_FORMATTER.format(date)} ${DAY_AND_MONTH_FORMATTER.format(date)}`;
}

/** "April 2026", for a row that crosses a month boundary. */
export function formatMonthAndYear(date: Date): string {
  return MONTH_FORMATTER.format(date);
}

/** "Monday 6 April at 19:00" — when the 48-hour rail lifts. */
export function formatDateAndTime(date: Date): string {
  return DATE_AND_TIME_FORMATTER.format(date);
}

/**
 * How far off a day is, in words.
 *
 * Used beside the date rather than instead of it, so the list reads as
 * "Wed 8 Apr · today" and never leaves someone counting.
 */
export function describeDaysAway(date: Date, now: Date): string {
  if (isSameLocalDay(date, now)) {
    return 'today';
  }

  const daysAway = countCalendarDaysBetween(now, date);

  if (daysAway === 1) {
    return 'tomorrow';
  }

  return `in ${String(daysAway)} days`;
}

/** "9 of 36 sessions". */
export function describeSessionsCompleted(
  completedSessionCount: number,
  totalSessionCount: number,
): string {
  return `${String(completedSessionCount)} of ${String(totalSessionCount)} sessions`;
}
