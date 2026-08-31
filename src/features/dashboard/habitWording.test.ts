import { describe, expect, it } from 'vitest';

import type { DailyHabitSummary, RecentHabitCompliance } from '@/domain/habitCompliance';
import { dailyHabitDefinitions } from '@/content/habits/dailyHabitDefinitions';
import type { DailyHabitId } from '@/types/habitTypes';

import {
  describeHabitAnswer,
  describeHabitStreak,
  describeHabitTarget,
  describeHabitsSoFarToday,
  describeRecentHabitCompliance,
  formatSleepHours,
  formatStepCount,
} from './habitWording';

function findHabitDefinition(habitId: DailyHabitId) {
  const habitDefinition = dailyHabitDefinitions.find(
    (definition) => definition.habitId === habitId,
  );

  if (!habitDefinition) {
    throw new Error(`The habit "${habitId}" is missing from the checklist content.`);
  }

  return habitDefinition;
}

function buildDailyHabitSummary(changes: Partial<DailyHabitSummary> = {}): DailyHabitSummary {
  return {
    metHabitIds: [],
    metHabitCount: 0,
    trackedHabitCount: 5,
    isEveryHabitMet: false,
    hasAnythingRecorded: true,
    ...changes,
  };
}

function buildRecentHabitCompliance(
  changes: Partial<RecentHabitCompliance> = {},
): RecentHabitCompliance {
  return { rows: [], daysConsidered: 7, goodDayCount: 5, ...changes };
}

describe('formatting the two numbers', () => {
  it('separates the thousands in a step count', () => {
    expect(formatStepCount(6000)).toBe('6,000');
    expect(formatStepCount(12500)).toBe('12,500');
  });

  it('rounds a step count, because half a step is not a thing', () => {
    expect(formatStepCount(6000.4)).toBe('6,000');
  });

  it('drops a trailing zero from a whole night of sleep', () => {
    expect(formatSleepHours(7)).toBe('7 h');
    expect(formatSleepHours(7.0)).toBe('7 h');
  });

  it('keeps a half hour', () => {
    expect(formatSleepHours(7.5)).toBe('7.5 h');
  });
});

describe('the target on a row', () => {
  /*
   * Steps are the only habit whose target moves, which is why this takes the
   * calculated number rather than reading a label off the content.
   */
  it('uses the step target for the week it is given', () => {
    expect(describeHabitTarget(findHabitDefinition('stepCount'), 7500)).toBe('7,500 steps');
  });

  it('uses the fixed label for everything else', () => {
    expect(describeHabitTarget(findHabitDefinition('didHitProteinTarget'), 7500)).toBe('150 g');
    expect(describeHabitTarget(findHabitDefinition('sleepHours'), 7500)).toBe('7 hours');
  });
});

describe('what a numeric row shows', () => {
  it('says an unanswered number is not logged rather than showing a zero', () => {
    expect(describeHabitAnswer(findHabitDefinition('stepCount'), null)).toBe('Not logged');
  });

  it('shows a recorded zero as a zero', () => {
    expect(describeHabitAnswer(findHabitDefinition('stepCount'), 0)).toBe('0');
  });

  it('formats each number in its own units', () => {
    expect(describeHabitAnswer(findHabitDefinition('stepCount'), 8200)).toBe('8,200');
    expect(describeHabitAnswer(findHabitDefinition('sleepHours'), 6.5)).toBe('6.5 h');
  });
});

describe('the headline', () => {
  /*
   * The distinction the panel exists to keep: a day nobody has opened is not a
   * day that went badly.
   */
  it('says nothing has been ticked rather than nought out of five', () => {
    expect(describeHabitsSoFarToday(buildDailyHabitSummary({ hasAnythingRecorded: false }))).toBe(
      'Nothing ticked yet today',
    );
  });

  it('counts what is done once the day has been touched', () => {
    expect(describeHabitsSoFarToday(buildDailyHabitSummary({ metHabitCount: 3 }))).toBe(
      '3 of 5 today',
    );
  });

  it('names a clean sweep', () => {
    expect(
      describeHabitsSoFarToday(buildDailyHabitSummary({ metHabitCount: 5, isEveryHabitMet: true })),
    ).toBe('All five, today');
  });
});

describe('the streak', () => {
  it('says nothing at all when there is no streak', () => {
    expect(describeHabitStreak(0)).toBeNull();
  });

  it('counts one day without pluralising it', () => {
    expect(describeHabitStreak(1)).toBe('One good day so far');
  });

  it('counts a run', () => {
    expect(describeHabitStreak(6)).toBe('6 good days in a row');
  });
});

describe('the recent stretch', () => {
  it('stays quiet until there is a week to talk about', () => {
    expect(
      describeRecentHabitCompliance(buildRecentHabitCompliance({ daysConsidered: 3 }), 7),
    ).toBeNull();
  });

  it('states the fraction of days that landed', () => {
    expect(describeRecentHabitCompliance(buildRecentHabitCompliance(), 7)).toBe(
      '5 of the last 7 days',
    );
  });

  it('states a bad week as plainly as a good one', () => {
    expect(describeRecentHabitCompliance(buildRecentHabitCompliance({ goodDayCount: 1 }), 7)).toBe(
      '1 of the last 7 days',
    );
  });
});
