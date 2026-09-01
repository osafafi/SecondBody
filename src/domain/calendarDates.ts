/**
 * Calendar days, as distinct from instants.
 *
 * The rest of `src/domain/` works in instants: the rest timer, the 48-hour rail
 * and the layoff rules all care about how much time has passed. A calendar
 * screen does not. It cares about which box on the grid a session belongs in,
 * and that is a question about the local calendar rather than about elapsed
 * milliseconds.
 *
 * **Every function here moves whole days rather than adding 24 hours.** Those
 * are not the same operation. On the night the clocks go back, adding 24 hours
 * to 00:30 lands at 23:30 on the *same* day, which would make "the next training
 * day" return today — twice a year, in a way nobody would ever reproduce
 * deliberately. `Date.setDate` moves the calendar, so it does the right thing on
 * both changeover nights.
 *
 * Nothing here reads a clock. Today is always passed in.
 */

const DAYS_PER_WEEK = 7;

/**
 * The days of the week, indexed by `Date.getDay()` — 0 is Sunday.
 *
 * Here rather than in a screen because two things now need it: the Schedule
 * header, which says which days he trains, and the coaching bundle, which says
 * the same thing to a reader who is not looking at the app. A second copy of a
 * list this short is not a disaster, but a second copy that starts on Monday
 * while this one starts on Sunday would be.
 */
export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** ISO `YYYY-MM-DD` in the local calendar — the day it was here, not in UTC. */
export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');

  return `${String(year)}-${month}-${dayOfMonth}`;
}

/** Midnight at the start of the local day this instant falls in. */
export function startOfLocalDay(date: Date): Date {
  const startOfDay = new Date(date.getTime());
  startOfDay.setHours(0, 0, 0, 0);

  return startOfDay;
}

/**
 * The same time of day, a whole number of days later. Negative counts go back.
 *
 * The time of day is preserved across a daylight-saving change rather than the
 * duration: 08:00 plus one day is 08:00 the next morning, which is what a
 * calendar means by tomorrow.
 */
export function addLocalDays(date: Date, dayCount: number): Date {
  const shifted = new Date(date.getTime());
  shifted.setDate(shifted.getDate() + dayCount);

  return shifted;
}

/** True when both instants fall on the same local calendar day. */
export function isSameLocalDay(firstDate: Date, secondDate: Date): boolean {
  return formatIsoDate(firstDate) === formatIsoDate(secondDate);
}

/**
 * Whole calendar days from one day to another, ignoring the time of day.
 *
 * `calculateWholeDaysBetween` in `sessionScheduling.ts` answers a different
 * question — how many 24-hour periods have elapsed — which is the right one for
 * a layoff and the wrong one for a grid. Monday 23:00 to Tuesday 01:00 is two
 * hours and one day.
 */
export function countCalendarDaysBetween(earlierDate: Date, laterDate: Date): number {
  const earlierMidnight = startOfLocalDay(earlierDate);
  const laterMidnight = startOfLocalDay(laterDate);

  const elapsedHours = (laterMidnight.getTime() - earlierMidnight.getTime()) / (60 * 60 * 1000);

  // Rounded rather than divided by 24, because a day containing a clock change
  // is 23 or 25 hours long and would otherwise come out fractional.
  return Math.round(elapsedHours / 24);
}

/**
 * Midnight on the first day of the week this date falls in.
 *
 * `firstDayOfWeek` uses `Date.getDay()` numbering, where 0 is Sunday. The
 * calendar grid passes 1, because a training week that runs Monday to Friday
 * reads wrong when it is split across two rows.
 */
export function startOfLocalWeek(date: Date, firstDayOfWeek: number): Date {
  const daysSinceWeekStart = (date.getDay() - firstDayOfWeek + DAYS_PER_WEEK) % DAYS_PER_WEEK;

  return startOfLocalDay(addLocalDays(date, -daysSinceWeekStart));
}

/**
 * Midnight, locally, on the day an ISO `YYYY-MM-DD` string names.
 *
 * The inverse of `formatIsoDate`, and deliberately not `new Date(isoDate)`:
 * that parses a bare date as UTC, so anywhere west of Greenwich it lands on the
 * evening of the day before. Every stored calendar day in this app — a weigh-in,
 * a programme start — was written by `formatIsoDate` from a local clock and has
 * to be read back the same way.
 */
export function parseIsoDate(isoDate: string): Date {
  const [year, month, dayOfMonth] = isoDate.split('-').map(Number);

  return new Date(year ?? 0, (month ?? 1) - 1, dayOfMonth ?? 1);
}

/**
 * Whole weeks between a stored calendar day and now.
 *
 * Whole, so week 1 lasts a week: something started last Wednesday is nought
 * weeks old on Tuesday and one week old on Wednesday. The expected weight range
 * and the trend verdict both step on that boundary, and rounding would move
 * them half a week early.
 */
export function countWholeWeeksSince(isoStartDate: string, now: Date): number {
  return Math.max(0, Math.floor(countCalendarDaysBetween(parseIsoDate(isoStartDate), now) / 7));
}
