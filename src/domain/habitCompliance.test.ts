import { describe, expect, it } from 'vitest';

import type { DailyHabitRecord } from '@/types/dailyTrackingTypes';

import {
  buildRecentHabitDays,
  countCurrentHabitStreak,
  isDailyHabitMet,
  isGoodHabitDay,
  summariseDailyHabits,
  summariseRecentHabitCompliance,
  type HabitDay,
} from './habitCompliance';

/**
 * A day nobody has touched: three unticked boxes and two unanswered numbers.
 * Every test starts here and turns on only what it is actually about.
 */
function buildHabitDay(onDate: string, changes: Partial<DailyHabitRecord> = {}): HabitDay {
  return {
    record: {
      onDate,
      didHitProteinTarget: false,
      didAvoidLiquidCalories: false,
      didCompleteMobilityRoutine: false,
      stepCount: null,
      sleepHours: null,
      updatedAt: new Date('2026-09-01T20:00:00Z'),
      ...changes,
    },
    dailyStepTarget: 6000,
    nightlySleepTargetHours: 7,
  };
}

/** A day that clears the three-of-five bar without hitting all five. */
function buildGoodHabitDay(onDate: string): HabitDay {
  return buildHabitDay(onDate, {
    didHitProteinTarget: true,
    didAvoidLiquidCalories: true,
    stepCount: 6000,
  });
}

describe('whether one habit was met', () => {
  it('reads the three ticks straight off the record', () => {
    const day = buildHabitDay('2026-09-01', {
      didHitProteinTarget: true,
      didAvoidLiquidCalories: false,
      didCompleteMobilityRoutine: true,
    });

    expect(isDailyHabitMet('didHitProteinTarget', day)).toBe(true);
    expect(isDailyHabitMet('didAvoidLiquidCalories', day)).toBe(false);
    expect(isDailyHabitMet('didCompleteMobilityRoutine', day)).toBe(true);
  });

  /*
   * The reason `HabitDay` carries a target at all. The same 6,000 steps is a
   * win in week two and a miss in week ten, and reading history back against
   * today's target would turn a run of good days into a run of failures every
   * time the ramp stepped up.
   */
  it('counts steps against the target that was in force on that day', () => {
    const weekTwoDay: HabitDay = {
      ...buildHabitDay('2026-09-01', { stepCount: 6000 }),
      dailyStepTarget: 5500,
    };

    const weekTenDay: HabitDay = {
      ...buildHabitDay('2026-11-01', { stepCount: 6000 }),
      dailyStepTarget: 8500,
    };

    expect(isDailyHabitMet('stepCount', weekTwoDay)).toBe(true);
    expect(isDailyHabitMet('stepCount', weekTenDay)).toBe(false);
  });

  it('treats an unanswered number as unmet rather than as a zero', () => {
    const day = buildHabitDay('2026-09-01');

    expect(isDailyHabitMet('stepCount', day)).toBe(false);
    expect(isDailyHabitMet('sleepHours', day)).toBe(false);
  });

  it('meets the sleep target exactly on the number', () => {
    expect(isDailyHabitMet('sleepHours', buildHabitDay('2026-09-01', { sleepHours: 7 }))).toBe(
      true,
    );
    expect(isDailyHabitMet('sleepHours', buildHabitDay('2026-09-01', { sleepHours: 6.9 }))).toBe(
      false,
    );
  });
});

describe('summarising one day', () => {
  it('lists what was met and counts it against all five', () => {
    const summary = summariseDailyHabits(
      buildHabitDay('2026-09-01', { didHitProteinTarget: true, sleepHours: 8 }),
    );

    expect(summary.metHabitIds).toEqual(['didHitProteinTarget', 'sleepHours']);
    expect(summary.metHabitCount).toBe(2);
    expect(summary.trackedHabitCount).toBe(5);
    expect(summary.isEveryHabitMet).toBe(false);
  });

  it('recognises a perfect day', () => {
    const summary = summariseDailyHabits(
      buildHabitDay('2026-09-01', {
        didHitProteinTarget: true,
        didAvoidLiquidCalories: true,
        didCompleteMobilityRoutine: true,
        stepCount: 9000,
        sleepHours: 8,
      }),
    );

    expect(summary.isEveryHabitMet).toBe(true);
    expect(summary.metHabitCount).toBe(5);
  });

  /*
   * The distinction the whole panel hangs on: an untouched day is not a day
   * where everything went wrong, and must not be shown as one.
   */
  it('tells an untouched day apart from a day that went badly', () => {
    expect(summariseDailyHabits(buildHabitDay('2026-09-01')).hasAnythingRecorded).toBe(false);

    expect(
      summariseDailyHabits(buildHabitDay('2026-09-01', { stepCount: 0 })).hasAnythingRecorded,
    ).toBe(true);

    expect(
      summariseDailyHabits(buildHabitDay('2026-09-01', { didHitProteinTarget: true }))
        .hasAnythingRecorded,
    ).toBe(true);
  });
});

describe('whether a day counts towards a streak', () => {
  it('takes three of the five', () => {
    expect(isGoodHabitDay(buildGoodHabitDay('2026-09-01'))).toBe(true);
  });

  it('does not take two', () => {
    expect(
      isGoodHabitDay(
        buildHabitDay('2026-09-01', { didHitProteinTarget: true, didAvoidLiquidCalories: true }),
      ),
    ).toBe(false);
  });
});

describe('the current streak', () => {
  it('counts back through consecutive good days', () => {
    const streak = countCurrentHabitStreak(
      [
        buildGoodHabitDay('2026-09-03'),
        buildGoodHabitDay('2026-09-02'),
        buildGoodHabitDay('2026-09-01'),
      ],
      '2026-09-03',
    );

    expect(streak).toBe(3);
  });

  /*
   * The rule that stops the panel telling somebody off at nine in the morning:
   * today has not happened yet, so it cannot have gone wrong.
   */
  it('keeps a streak alive on a today that has not been ticked yet', () => {
    const streak = countCurrentHabitStreak(
      [buildGoodHabitDay('2026-09-02'), buildGoodHabitDay('2026-09-01')],
      '2026-09-03',
    );

    expect(streak).toBe(2);
  });

  it('ends the streak at a bad yesterday, because yesterday is over', () => {
    const streak = countCurrentHabitStreak(
      [buildHabitDay('2026-09-02', { didHitProteinTarget: true }), buildGoodHabitDay('2026-09-01')],
      '2026-09-03',
    );

    expect(streak).toBe(0);
  });

  it('counts today when today is already good', () => {
    const streak = countCurrentHabitStreak(
      [buildGoodHabitDay('2026-09-03'), buildHabitDay('2026-09-02')],
      '2026-09-03',
    );

    expect(streak).toBe(1);
  });

  it('treats a day nothing was recorded for as a break', () => {
    const streak = countCurrentHabitStreak(
      [buildGoodHabitDay('2026-09-03'), buildGoodHabitDay('2026-09-01')],
      '2026-09-03',
    );

    expect(streak).toBe(1);
  });

  it('is zero when there is nothing recorded at all', () => {
    expect(countCurrentHabitStreak([], '2026-09-03')).toBe(0);
  });

  /*
   * Counting back a day has to move the calendar rather than subtract 24 hours.
   * The clocks go back in the UK on 25 October 2026.
   */
  it('counts back correctly across a daylight-saving change', () => {
    const streak = countCurrentHabitStreak(
      [
        buildGoodHabitDay('2026-10-26'),
        buildGoodHabitDay('2026-10-25'),
        buildGoodHabitDay('2026-10-24'),
      ],
      '2026-10-26',
    );

    expect(streak).toBe(3);
  });
});

describe('the last stretch of days', () => {
  it('counts each habit separately over the window it is given', () => {
    const compliance = summariseRecentHabitCompliance([
      buildHabitDay('2026-09-03', { didHitProteinTarget: true, stepCount: 7000 }),
      buildHabitDay('2026-09-02', { didHitProteinTarget: true }),
      buildHabitDay('2026-09-01', { sleepHours: 8 }),
    ]);

    const findRow = (habitId: string) => compliance.rows.find((row) => row.habitId === habitId);

    expect(compliance.daysConsidered).toBe(3);
    expect(findRow('didHitProteinTarget')?.daysMet).toBe(2);
    expect(findRow('stepCount')?.daysMet).toBe(1);
    expect(findRow('sleepHours')?.daysMet).toBe(1);
    expect(findRow('didCompleteMobilityRoutine')?.daysMet).toBe(0);
  });

  it('counts the days that cleared the three-of-five bar', () => {
    const compliance = summariseRecentHabitCompliance([
      buildGoodHabitDay('2026-09-03'),
      buildHabitDay('2026-09-02', { didHitProteinTarget: true }),
      buildGoodHabitDay('2026-09-01'),
    ]);

    expect(compliance.goodDayCount).toBe(2);
  });

  it('has a row for every habit even with nothing recorded', () => {
    const compliance = summariseRecentHabitCompliance([]);

    expect(compliance.rows).toHaveLength(5);
    expect(compliance.rows.every((row) => row.daysMet === 0)).toBe(true);
    expect(compliance.daysConsidered).toBe(0);
  });
});

describe('building the recent window', () => {
  const buildWindow = (changes: Partial<Parameters<typeof buildRecentHabitDays>[0]> = {}) =>
    buildRecentHabitDays({
      records: [],
      todayIsoDate: '2026-09-10',
      earliestIsoDate: '2026-09-01',
      maximumDayCount: 30,
      resolveDailyStepTarget: () => 6000,
      nightlySleepTargetHours: 7,
      ...changes,
    });

  it('returns one day per calendar day, newest first', () => {
    const window = buildWindow({ todayIsoDate: '2026-09-03', earliestIsoDate: '2026-09-01' });

    expect(window.map((day) => day.record.onDate)).toEqual([
      '2026-09-03',
      '2026-09-02',
      '2026-09-01',
    ]);
  });

  /*
   * The rule the compliance figure depends on. A day nobody opened the
   * checklist on is a day the habits did not happen, and dropping it would turn
   * a bad fortnight into "three of the last three days".
   */
  it('fills a day nothing was recorded for with a blank record', () => {
    const window = buildWindow({
      todayIsoDate: '2026-09-03',
      earliestIsoDate: '2026-09-01',
      records: [buildGoodHabitDay('2026-09-03').record],
    });

    expect(window).toHaveLength(3);
    expect(summariseDailyHabits(window[1] as HabitDay).hasAnythingRecorded).toBe(false);
    expect(summariseRecentHabitCompliance(window).goodDayCount).toBe(1);
  });

  it('never reaches back past the day the programme started', () => {
    const window = buildWindow({ todayIsoDate: '2026-09-03', earliestIsoDate: '2026-09-02' });

    expect(window).toHaveLength(2);
  });

  it('stops at the maximum it was given', () => {
    const window = buildWindow({ maximumDayCount: 4 });

    expect(window).toHaveLength(4);
  });

  it('asks for the step target of each day separately', () => {
    const requestedDates: string[] = [];

    buildWindow({
      todayIsoDate: '2026-09-02',
      earliestIsoDate: '2026-09-01',
      resolveDailyStepTarget: (isoDate) => {
        requestedDates.push(isoDate);

        return 6000;
      },
    });

    expect(requestedDates).toEqual(['2026-09-02', '2026-09-01']);
  });

  it('is empty when today is before the programme started', () => {
    expect(buildWindow({ todayIsoDate: '2026-08-30', earliestIsoDate: '2026-09-01' })).toEqual([]);
  });
});
