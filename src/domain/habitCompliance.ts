import { buildEmptyDailyHabitRecord, type DailyHabitRecord } from '@/types/dailyTrackingTypes';
import { DAILY_HABIT_IDS, type DailyHabitId } from '@/types/habitTypes';

import { addLocalDays, formatIsoDate, parseIsoDate } from './calendarDates';
import { hasMetDailyStepTarget, hasMetNightlySleepTarget } from './habitTargets';

/**
 * Reading the daily checklist back: what was met, how often, and how long the
 * run of decent days is.
 *
 * `habitTargets.ts` answers "what is being asked for today". This answers "what
 * actually happened", which is a different question and the one the Today screen
 * puts on screen.
 *
 * **The step target travels with the day, not with the summary.** It climbs from
 * 5,000 to 9,000 across the twelve weeks, so a week-two day that hit 6,000 met
 * its target and must keep meeting it when it is read back in week ten. Judging
 * history against today's target would quietly turn a run of good days into a
 * run of failures every time the ramp stepped up. That is why every function
 * here takes `HabitDay` rather than a bare record.
 */

/**
 * One recorded day, with the targets that were being asked for on it.
 *
 * The sleep target is carried alongside the step target even though it does not
 * currently move, so that changing it later is a content edit rather than a
 * rewrite of the history it would otherwise silently re-judge.
 */
export type HabitDay = {
  record: DailyHabitRecord;
  dailyStepTarget: number;
  nightlySleepTargetHours: number;
};

/**
 * How many of the five have to land for the day to count towards a streak.
 *
 * Three of five, not five of five. A streak that breaks the first time somebody
 * gets six hours' sleep is a streak nobody keeps for a fortnight, and the whole
 * point of the checklist is that most days is enough — see
 * docs/TRAINING_PROGRAM.md section 9 and CLAUDE.md section 7.
 */
export const MINIMUM_HABITS_FOR_A_GOOD_DAY = 3;

/** Whether one habit was met on one day. */
export function isDailyHabitMet(habitId: DailyHabitId, day: HabitDay): boolean {
  const { record, dailyStepTarget, nightlySleepTargetHours } = day;

  const habitVerdicts: Record<DailyHabitId, () => boolean> = {
    didHitProteinTarget: () => record.didHitProteinTarget,
    didAvoidLiquidCalories: () => record.didAvoidLiquidCalories,
    didCompleteMobilityRoutine: () => record.didCompleteMobilityRoutine,
    stepCount: () => hasMetDailyStepTarget(record.stepCount, dailyStepTarget),
    sleepHours: () => hasMetNightlySleepTarget(record.sleepHours, nightlySleepTargetHours),
  };

  return habitVerdicts[habitId]();
}

export type DailyHabitSummary = {
  metHabitIds: DailyHabitId[];
  metHabitCount: number;

  /** Always the length of `DAILY_HABIT_IDS`. Carried so callers do not import it. */
  trackedHabitCount: number;

  isEveryHabitMet: boolean;

  /**
   * True when somebody actually opened the checklist that day.
   *
   * An untouched day and a day where everything genuinely went wrong both read
   * as five unmet habits — the three ticks default to false, as
   * `dailyTrackingDocumentMapping.ts` explains. This is what separates them, and
   * it is why the panel says "nothing logged yet" rather than "0 of 5".
   */
  hasAnythingRecorded: boolean;
};

export function summariseDailyHabits(day: HabitDay): DailyHabitSummary {
  const metHabitIds = DAILY_HABIT_IDS.filter((habitId) => isDailyHabitMet(habitId, day));

  const { record } = day;

  return {
    metHabitIds,
    metHabitCount: metHabitIds.length,
    trackedHabitCount: DAILY_HABIT_IDS.length,
    isEveryHabitMet: metHabitIds.length === DAILY_HABIT_IDS.length,
    hasAnythingRecorded:
      record.didHitProteinTarget ||
      record.didAvoidLiquidCalories ||
      record.didCompleteMobilityRoutine ||
      record.stepCount !== null ||
      record.sleepHours !== null,
  };
}

/** True when enough of the five landed for the day to count towards a streak. */
export function isGoodHabitDay(day: HabitDay): boolean {
  return summariseDailyHabits(day).metHabitCount >= MINIMUM_HABITS_FOR_A_GOOD_DAY;
}

/**
 * The run of good days ending now, in days.
 *
 * **Today counts when it is good and is skipped when it is not**, rather than
 * ending the run at zero. At nine in the morning nothing has been ticked yet and
 * the day is not a failure — it has not happened. Only a bad *yesterday* breaks
 * a streak, because yesterday is over.
 *
 * `days` may be in any order and may have gaps; a missing day is a day nothing
 * was recorded for, which is not a good day and so ends the run.
 */
export function countCurrentHabitStreak(days: HabitDay[], todayIsoDate: string): number {
  const dayByDate = new Map(days.map((day) => [day.record.onDate, day]));

  const isGoodOn = (isoDate: string): boolean => {
    const day = dayByDate.get(isoDate);

    return day !== undefined && isGoodHabitDay(day);
  };

  const shiftDate = (isoDate: string, dayCount: number): string =>
    formatIsoDate(addLocalDays(parseIsoDate(isoDate), dayCount));

  let streakLength = 0;
  let cursorDate = todayIsoDate;

  if (isGoodOn(cursorDate)) {
    streakLength += 1;
  }

  cursorDate = shiftDate(cursorDate, -1);

  while (isGoodOn(cursorDate)) {
    streakLength += 1;
    cursorDate = shiftDate(cursorDate, -1);
  }

  return streakLength;
}

export type RecentHabitDaysInput = {
  /** Whatever the repository returned, in any order and with gaps. */
  records: DailyHabitRecord[];

  todayIsoDate: string;

  /**
   * The earliest day worth counting — the day the programme started.
   *
   * Without it, a checklist opened on day three would report "1 of the last 7
   * days" and be counting four days that happened before the app existed.
   */
  earliestIsoDate: string;

  /** A ceiling on the window, so an old programme does not build a year of days. */
  maximumDayCount: number;

  /** The step target in force on a given day. It climbs across the programme. */
  resolveDailyStepTarget: (isoDate: string) => number;

  nightlySleepTargetHours: number;
};

/**
 * The recent calendar days, newest first, each with the targets it was judged
 * against.
 *
 * **Calendar days, not recorded days.** A day nothing was written for is
 * included as a blank record, because a day the checklist was never opened on
 * is a day the habits did not happen — dropping it would turn a fortnight with
 * three good days in it into "three of the last three days", which is the sort
 * of number that makes an app feel like it is on your side rather than telling
 * you the truth.
 *
 * A callback resolves the step target rather than a table of them, so that the
 * ramp stays in `habitTargets.ts` and this function stays about which days.
 */
export function buildRecentHabitDays(input: RecentHabitDaysInput): HabitDay[] {
  const {
    records,
    todayIsoDate,
    earliestIsoDate,
    maximumDayCount,
    resolveDailyStepTarget,
    nightlySleepTargetHours,
  } = input;

  const recordByDate = new Map(records.map((record) => [record.onDate, record]));
  const recentDays: HabitDay[] = [];

  for (let dayOffset = 0; dayOffset < maximumDayCount; dayOffset += 1) {
    const isoDate = formatIsoDate(addLocalDays(parseIsoDate(todayIsoDate), -dayOffset));

    // ISO dates compare correctly as strings, which is most of why they are stored as one.
    if (isoDate < earliestIsoDate) {
      break;
    }

    recentDays.push({
      /*
       * A blank day's `updatedAt` is filled with the day itself rather than the
       * current time. Nothing reads it off a day that was never written, and a
       * clock read here would make rendering non-deterministic.
       */
      record:
        recordByDate.get(isoDate) ?? buildEmptyDailyHabitRecord(isoDate, parseIsoDate(isoDate)),
      dailyStepTarget: resolveDailyStepTarget(isoDate),
      nightlySleepTargetHours,
    });
  }

  return recentDays;
}

export type HabitComplianceRow = {
  habitId: DailyHabitId;
  daysMet: number;
};

export type RecentHabitCompliance = {
  /** One row per habit, in `DAILY_HABIT_IDS` order. */
  rows: HabitComplianceRow[];

  /** How many days were looked at. The denominator for every row. */
  daysConsidered: number;

  /** Of those, how many cleared `MINIMUM_HABITS_FOR_A_GOOD_DAY`. */
  goodDayCount: number;
};

/**
 * How the last stretch of days went, habit by habit.
 *
 * The window is whatever the caller passes in rather than a constant here: a
 * screen showing a week and a screen showing a month want the same arithmetic
 * over different slices, and a function that trimmed the list itself would need
 * to know today's date to do it correctly.
 */
export function summariseRecentHabitCompliance(days: HabitDay[]): RecentHabitCompliance {
  return {
    rows: DAILY_HABIT_IDS.map((habitId) => ({
      habitId,
      daysMet: days.filter((day) => isDailyHabitMet(habitId, day)).length,
    })),
    daysConsidered: days.length,
    goodDayCount: days.filter(isGoodHabitDay).length,
  };
}
