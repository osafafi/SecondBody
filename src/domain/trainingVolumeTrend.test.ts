import { describe, expect, it } from 'vitest';

import {
  calculateTotalVolumeKilograms,
  compareLatestWeekToPrevious,
  findHeaviestWeek,
  groupTrainingVolumeByWeek,
  type CompletedSessionVolume,
} from './trainingVolumeTrend';

/** A Thursday, so the week it belongs to is not the day it falls on. */
const NOW = new Date(2026, 3, 9, 18, 0);

function buildSession(completedAt: Date, totalVolumeKilograms: number): CompletedSessionVolume {
  return { completedAt, totalVolumeKilograms };
}

describe('groupTrainingVolumeByWeek', () => {
  it('returns the requested number of weeks, oldest first', () => {
    const weeks = groupTrainingVolumeByWeek({
      completedSessions: [],
      now: NOW,
      weekCount: 4,
      firstDayOfWeek: 1,
    });

    expect(weeks.map((week) => week.weekStartOn)).toEqual([
      '2026-03-16',
      '2026-03-23',
      '2026-03-30',
      '2026-04-06',
    ]);
  });

  it('keeps weeks nothing happened in', () => {
    /*
     * The bar chart has to show a fortnight off as two empty bars. Dropping them
     * would redraw a layoff as an unbroken climb.
     */
    const weeks = groupTrainingVolumeByWeek({
      completedSessions: [buildSession(new Date(2026, 3, 7, 19, 0), 4000)],
      now: NOW,
      weekCount: 3,
      firstDayOfWeek: 1,
    });

    expect(weeks.map((week) => week.sessionCount)).toEqual([0, 0, 1]);
    expect(weeks.map((week) => week.totalVolumeKilograms)).toEqual([0, 0, 4000]);
  });

  it('adds up every session in a week', () => {
    const weeks = groupTrainingVolumeByWeek({
      completedSessions: [
        buildSession(new Date(2026, 3, 6, 19, 0), 4000),
        buildSession(new Date(2026, 3, 8, 19, 0), 4200.5),
        buildSession(new Date(2026, 3, 9, 7, 0), 3800),
      ],
      now: NOW,
      weekCount: 2,
      firstDayOfWeek: 1,
    });

    expect(weeks[1]).toEqual({
      weekStartOn: '2026-04-06',
      totalVolumeKilograms: 12000.5,
      sessionCount: 3,
    });
  });

  it('puts a Sunday session in the week that started the Monday before', () => {
    const weeks = groupTrainingVolumeByWeek({
      // 2026-04-05 is the Sunday before the current week.
      completedSessions: [buildSession(new Date(2026, 3, 5, 11, 0), 3000)],
      now: NOW,
      weekCount: 2,
      firstDayOfWeek: 1,
    });

    expect(weeks[0]?.weekStartOn).toBe('2026-03-30');
    expect(weeks[0]?.sessionCount).toBe(1);
  });

  it('drops sessions older than the window rather than piling them into the first bar', () => {
    const weeks = groupTrainingVolumeByWeek({
      completedSessions: [buildSession(new Date(2025, 11, 1, 19, 0), 9999)],
      now: NOW,
      weekCount: 3,
      firstDayOfWeek: 1,
    });

    expect(calculateTotalVolumeKilograms(weeks)).toBe(0);
  });

  it('honours a Sunday-first week', () => {
    const weeks = groupTrainingVolumeByWeek({
      completedSessions: [],
      now: NOW,
      weekCount: 1,
      firstDayOfWeek: 0,
    });

    expect(weeks[0]?.weekStartOn).toBe('2026-04-05');
  });
});

describe('compareLatestWeekToPrevious', () => {
  it('has nothing to compare with fewer than two weeks', () => {
    expect(compareLatestWeekToPrevious([])).toBeNull();
    expect(
      compareLatestWeekToPrevious([
        { weekStartOn: '2026-04-06', totalVolumeKilograms: 100, sessionCount: 1 },
      ]),
    ).toBeNull();
  });

  it('reports the change in kilograms and as a ratio', () => {
    const comparison = compareLatestWeekToPrevious([
      { weekStartOn: '2026-03-30', totalVolumeKilograms: 10000, sessionCount: 3 },
      { weekStartOn: '2026-04-06', totalVolumeKilograms: 11000, sessionCount: 3 },
    ]);

    expect(comparison?.changeKilograms).toBe(1000);
    expect(comparison?.changeRatio).toBe(0.1);
  });

  it('reports a drop as a negative change', () => {
    const comparison = compareLatestWeekToPrevious([
      { weekStartOn: '2026-03-30', totalVolumeKilograms: 10000, sessionCount: 3 },
      { weekStartOn: '2026-04-06', totalVolumeKilograms: 8000, sessionCount: 2 },
    ]);

    expect(comparison?.changeKilograms).toBe(-2000);
    expect(comparison?.changeRatio).toBe(-0.2);
  });

  it('refuses a ratio against an empty week', () => {
    /*
     * Coming back from a week off is not an infinite improvement. The caller
     * should say "first week back" instead, which it can only do if this is null.
     */
    const comparison = compareLatestWeekToPrevious([
      { weekStartOn: '2026-03-30', totalVolumeKilograms: 0, sessionCount: 0 },
      { weekStartOn: '2026-04-06', totalVolumeKilograms: 8000, sessionCount: 2 },
    ]);

    expect(comparison?.changeKilograms).toBe(8000);
    expect(comparison?.changeRatio).toBeNull();
  });
});

describe('findHeaviestWeek', () => {
  it('is null when nothing was trained', () => {
    expect(
      findHeaviestWeek([{ weekStartOn: '2026-04-06', totalVolumeKilograms: 0, sessionCount: 0 }]),
    ).toBeNull();
  });

  it('finds the biggest week', () => {
    const heaviest = findHeaviestWeek([
      { weekStartOn: '2026-03-30', totalVolumeKilograms: 10000, sessionCount: 3 },
      { weekStartOn: '2026-04-06', totalVolumeKilograms: 12000, sessionCount: 3 },
      { weekStartOn: '2026-04-13', totalVolumeKilograms: 9000, sessionCount: 2 },
    ]);

    expect(heaviest?.weekStartOn).toBe('2026-04-06');
  });

  it('keeps the earlier week when two tie, so the answer does not drift', () => {
    const heaviest = findHeaviestWeek([
      { weekStartOn: '2026-03-30', totalVolumeKilograms: 10000, sessionCount: 3 },
      { weekStartOn: '2026-04-06', totalVolumeKilograms: 10000, sessionCount: 3 },
    ]);

    expect(heaviest?.weekStartOn).toBe('2026-03-30');
  });
});

describe('calculateTotalVolumeKilograms', () => {
  it('adds the weeks up', () => {
    expect(
      calculateTotalVolumeKilograms([
        { weekStartOn: '2026-03-30', totalVolumeKilograms: 10000.5, sessionCount: 3 },
        { weekStartOn: '2026-04-06', totalVolumeKilograms: 9999.5, sessionCount: 3 },
      ]),
    ).toBe(20000);
  });
});
