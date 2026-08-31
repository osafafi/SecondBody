import { countCalendarDaysBetween, isSameLocalDay } from '@/domain/calendarDates';

/**
 * Turning dates and durations into the words the Today screen uses.
 *
 * Kept out of the components for the same reason `prescriptionWording.ts` is:
 * "Wednesday" or "in 3 days" is a decision about how something reads, and
 * decisions that read badly are easier to find and fix when they are in one
 * file rather than spread through JSX.
 *
 * These are not coach lines. Harout's copy lives in `src/content/coachVoice/`
 * and nothing here has an opinion or a tone — these are labels.
 */

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
const DAY_AND_MONTH_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const TIME_OF_DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: 'numeric',
  minute: '2-digit',
});

/** "Wednesday 8 April" — the line under the screen title. */
export function formatFullDate(date: Date): string {
  return DAY_AND_MONTH_FORMATTER.format(date);
}

/** "19:00". Used for the moment the 48-hour rail lifts. */
export function formatTimeOfDay(date: Date): string {
  return TIME_OF_DAY_FORMATTER.format(date);
}

/**
 * How to refer to a day relative to today.
 *
 * Named days out to a week, because "Friday" is instantly readable and "in 2
 * days" needs arithmetic. Past a week the weekday alone becomes ambiguous, so
 * the date comes with it.
 */
export function describeTrainingDay(date: Date, now: Date): string {
  if (isSameLocalDay(date, now)) {
    return 'today';
  }

  const daysAway = countCalendarDaysBetween(now, date);

  if (daysAway === 1) {
    return 'tomorrow';
  }

  if (daysAway > 1 && daysAway <= 6) {
    return WEEKDAY_FORMATTER.format(date);
  }

  return DAY_AND_MONTH_FORMATTER.format(date);
}

/**
 * How much longer the 48-hour rail has to run.
 *
 * Rounded up to the hour, and never down to "0 hours" — a rail with eleven
 * minutes left is still a rail, and "in under an hour" is both true and more
 * useful than a zero.
 */
export function describeWaitUntilAllowed(hoursUntilAllowed: number): string {
  if (hoursUntilAllowed <= 0) {
    return 'now';
  }

  if (hoursUntilAllowed < 1) {
    return 'in under an hour';
  }

  const wholeHours = Math.ceil(hoursUntilAllowed);

  return wholeHours === 1 ? 'in an hour' : `in ${String(wholeHours)} hours`;
}

/** "3 days ago", for how long it has been since the last session. */
export function describeDaysSinceLastSession(daysSinceLastSession: number): string {
  if (daysSinceLastSession <= 0) {
    return 'today';
  }

  return daysSinceLastSession === 1 ? 'yesterday' : `${String(daysSinceLastSession)} days ago`;
}

/** "6 movements", "1 movement". */
export function describeMovementCount(movementCount: number): string {
  return movementCount === 1 ? '1 movement' : `${String(movementCount)} movements`;
}

/**
 * "84.3 kg". One decimal place, because a bathroom scale has one.
 *
 * The Progress screen has an identical formatter in its own wording file.
 * Features may not import from each other — see CLAUDE.md section 3 — and one
 * shared line of `toFixed` is not worth a shared module that both features would
 * then have to agree about. If a third screen ever shows a weight, promote it.
 */
export function formatWeightKilograms(weightKilograms: number): string {
  return `${weightKilograms.toFixed(1)} kg`;
}
