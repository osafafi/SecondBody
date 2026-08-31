import type { DailyHabitSummary, RecentHabitCompliance } from '@/domain/habitCompliance';
import type { DailyHabitDefinition } from '@/types/habitTypes';

/**
 * Turning the checklist's numbers into the sentences on the panel.
 *
 * Same rule as `todayWording.ts` and `progressWording.ts`: these are labels, not
 * coach lines. Harout's copy lives in `src/content/coachVoice/` and is fixed
 * text chosen by category — nothing here could be written in advance, because
 * every string below has a number in it that only exists at runtime.
 *
 * What they do borrow is the voice's rules. Nothing here scolds, and nothing
 * here congratulates: a streak is stated as a fact and a bad week is stated as
 * a fact, because a checklist that editorialises daily is a checklist that gets
 * ignored by the second week.
 */

/** "6,000". Thousands separators, because a five-digit step count is unreadable without. */
export function formatStepCount(stepCount: number): string {
  return Math.round(stepCount).toLocaleString('en-GB');
}

/** "7 h" / "7.5 h". A trailing ".0" on a night's sleep reads like a measurement. */
export function formatSleepHours(sleepHours: number): string {
  const roundedHours = Math.round(sleepHours * 10) / 10;

  return `${Number.isInteger(roundedHours) ? String(roundedHours) : roundedHours.toFixed(1)} h`;
}

/**
 * What is being asked for on this row, today.
 *
 * Steps are the only habit whose target moves, so they are the only one this
 * has to calculate — the rest carry their target as content.
 */
export function describeHabitTarget(
  habitDefinition: DailyHabitDefinition,
  dailyStepTarget: number,
): string {
  if (habitDefinition.habitId === 'stepCount') {
    return `${formatStepCount(dailyStepTarget)} steps`;
  }

  return habitDefinition.staticTargetLabel ?? '';
}

/** What a numeric row shows when it has an answer, and when it does not. */
export function describeHabitAnswer(
  habitDefinition: DailyHabitDefinition,
  answeredValue: number | null,
): string {
  if (answeredValue === null) {
    return 'Not logged';
  }

  return habitDefinition.habitId === 'sleepHours'
    ? formatSleepHours(answeredValue)
    : formatStepCount(answeredValue);
}

/**
 * The panel's headline.
 *
 * An untouched day says so rather than reading "0 of 5". They are genuinely
 * different facts — see `hasAnythingRecorded` — and a screen opened at breakfast
 * that says nought out of five is telling somebody off for a day that has not
 * happened yet.
 */
export function describeHabitsSoFarToday(summary: DailyHabitSummary): string {
  if (!summary.hasAnythingRecorded) {
    return 'Nothing ticked yet today';
  }

  if (summary.isEveryHabitMet) {
    return 'All five, today';
  }

  return `${String(summary.metHabitCount)} of ${String(summary.trackedHabitCount)} today`;
}

/**
 * The run of decent days, or null when there is nothing to say.
 *
 * Null rather than "0 days in a row", which would be the app pointing out a
 * streak that does not exist. Silence is part of the voice — see CLAUDE.md
 * section 7.
 */
export function describeHabitStreak(streakLength: number): string | null {
  if (streakLength <= 0) {
    return null;
  }

  return streakLength === 1 ? 'One good day so far' : `${String(streakLength)} good days in a row`;
}

/**
 * How the last stretch went, as a fraction of days.
 *
 * Null until there is a week to talk about. A single recorded day reported as
 * "1 of 1 day" is arithmetic, not information.
 */
export function describeRecentHabitCompliance(
  compliance: RecentHabitCompliance,
  minimumDaysBeforeReporting: number,
): string | null {
  if (compliance.daysConsidered < minimumDaysBeforeReporting) {
    return null;
  }

  return `${String(compliance.goodDayCount)} of the last ${String(compliance.daysConsidered)} days`;
}
