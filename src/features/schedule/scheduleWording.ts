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

/**
 * Which month a week row of the calendar belongs to, as "April 2026".
 *
 * A row of seven days can straddle two months, so one of them has to be
 * chosen. The **median** day decides it, and that is not an arbitrary pick: with
 * an odd number of days, the month holding the median day is always the month
 * holding the majority of the row. A row of Mon 31 August to Sun 6 September is
 * six sevenths September, and the median day is the Thursday, which is in
 * September. Taking the row's first day instead would file that row under
 * August and put the heading a week out for the first six days of every month.
 *
 * Returns an empty string for an empty row, which cannot happen —
 * `buildTrainingCalendar` always produces seven — but is cheaper to return than
 * to make impossible in the type.
 */
export function describeWeekMonth(weekDates: readonly Date[]): string {
  const medianDate = weekDates[Math.floor(weekDates.length / 2)];

  return medianDate ? formatMonthAndYear(medianDate) : '';
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
