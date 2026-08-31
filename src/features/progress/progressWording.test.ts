import { describe, expect, it } from 'vitest';

import type { BodyWeightTrendSummary } from '@/domain/bodyWeightTrend';
import type { TrainingVolumeComparison } from '@/domain/trainingVolumeTrend';

import {
  describeBodyWeightTrend,
  describeVolumeComparison,
  describeWeightChange,
  formatRecordEffort,
  formatShortDate,
  formatVolumeKilograms,
  formatWeekColumnLabel,
  formatWeightKilograms,
} from './progressWording';

function buildSummary(overrides: Partial<BodyWeightTrendSummary> = {}): BodyWeightTrendSummary {
  return {
    series: [],
    latestRecordedWeightKilograms: 88,
    latestRollingAverageKilograms: 87.8,
    changeSinceStartKilograms: -2.2,
    weeklyChangeKilograms: -0.4,
    remainingToTargetKilograms: 7.8,
    expectedRange: { heaviest: 88, lightest: 87.5 },
    verdict: 'onTrack',
    ...overrides,
  };
}

function buildComparison(
  overrides: Partial<TrainingVolumeComparison> = {},
): TrainingVolumeComparison {
  return {
    previousWeek: { weekStartOn: '2026-03-30', totalVolumeKilograms: 10000, sessionCount: 3 },
    latestWeek: { weekStartOn: '2026-04-06', totalVolumeKilograms: 11000, sessionCount: 3 },
    changeKilograms: 1000,
    changeRatio: 0.1,
    ...overrides,
  };
}

describe('formatShortDate', () => {
  it('reads as a day and a month', () => {
    expect(formatShortDate('2026-04-06')).toBe('6 Apr');
  });
});

describe('formatWeightKilograms', () => {
  it('keeps one decimal place, because a scale has one', () => {
    expect(formatWeightKilograms(87)).toBe('87.0 kg');
    expect(formatWeightKilograms(87.84)).toBe('87.8 kg');
  });
});

describe('describeWeightChange', () => {
  it('says down for a loss rather than showing a minus sign', () => {
    expect(describeWeightChange(-1.4)).toBe('1.4 kg down');
  });

  it('says up for a gain', () => {
    expect(describeWeightChange(0.6)).toBe('0.6 kg up');
  });

  it('says level rather than nought', () => {
    expect(describeWeightChange(0)).toBe('level');
    expect(describeWeightChange(-0.04)).toBe('level');
  });
});

describe('formatVolumeKilograms', () => {
  it('separates thousands and drops the decimals', () => {
    expect(formatVolumeKilograms(12_437.6)).toBe('12,438 kg');
  });
});

describe('describeBodyWeightTrend', () => {
  it('invites a first weigh-in rather than showing an empty chart', () => {
    expect(describeBodyWeightTrend(buildSummary({ verdict: 'noReadings' }))).toContain(
      'Log a weight',
    );
  });

  it('explains the water weight in the first three weeks', () => {
    const description = describeBodyWeightTrend(buildSummary({ verdict: 'tooEarlyToTell' }));

    expect(description).toContain('water');
    expect(description).toContain('the plan working');
  });

  it('leads with the average, never with the raw reading', () => {
    const description = describeBodyWeightTrend(buildSummary());

    expect(description).toContain('7-day average is 87.8 kg');
    expect(description).not.toContain('88.0 kg');
  });

  it('says a heavier than expected trend plainly, without blame', () => {
    const description = describeBodyWeightTrend(
      buildSummary({ verdict: 'behindExpectation', changeSinceStartKilograms: -0.4 }),
    );

    expect(description).toContain('heavier than the plan expected');
    expect(description.toLowerCase()).not.toContain('should have');
  });

  it('refuses to congratulate losing weight too fast', () => {
    const description = describeBodyWeightTrend(
      buildSummary({ verdict: 'aheadOfExpectation', changeSinceStartKilograms: -6 }),
    );

    expect(description).toContain('not automatically good news');
    expect(description).toContain('muscle');
  });

  it('drops the change clause when nothing has changed', () => {
    const description = describeBodyWeightTrend(buildSummary({ changeSinceStartKilograms: 0 }));

    expect(description).toContain('The 7-day average is 87.8 kg.');
    expect(description).not.toContain('since you started');
  });
});

describe('describeVolumeComparison', () => {
  it('says nothing when there is nothing to compare', () => {
    expect(describeVolumeComparison(null)).toBeNull();
  });

  it('reports an increase as a percentage', () => {
    expect(describeVolumeComparison(buildComparison())).toBe('10% more work than last week.');
  });

  it('reports a drop without dressing it up', () => {
    expect(
      describeVolumeComparison(
        buildComparison({
          changeKilograms: -2000,
          changeRatio: -0.2,
          latestWeek: {
            weekStartOn: '2026-04-06',
            totalVolumeKilograms: 8000,
            sessionCount: 2,
          },
        }),
      ),
    ).toBe('20% less work than last week.');
  });

  it('treats a small change as no change', () => {
    expect(describeVolumeComparison(buildComparison({ changeRatio: 0.02 }))).toBe(
      'About the same amount of work as last week.',
    );
  });

  it('does not turn a week off into an infinite improvement', () => {
    expect(describeVolumeComparison(buildComparison({ changeRatio: null }))).toContain(
      'First week back',
    );
  });

  it('says so when this week is still empty', () => {
    expect(
      describeVolumeComparison(
        buildComparison({
          latestWeek: { weekStartOn: '2026-04-06', totalVolumeKilograms: 0, sessionCount: 0 },
        }),
      ),
    ).toBe('Nothing logged this week yet.');
  });
});

describe('formatRecordEffort', () => {
  it('reads as weight by reps', () => {
    expect(formatRecordEffort(52.5, 10)).toBe('52.5 kg × 10');
  });
});

describe('formatWeekColumnLabel', () => {
  it('names the month on the first column', () => {
    expect(formatWeekColumnLabel('2026-03-16', null)).toBe('16 Mar');
  });

  it('shows the day alone inside a month', () => {
    expect(formatWeekColumnLabel('2026-03-23', '2026-03-16')).toBe('23');
  });

  it('names the month again when it changes', () => {
    /*
     * Without this, eight weeks spanning three months shows "16" twice and there
     * is no way to tell March from April.
     */
    expect(formatWeekColumnLabel('2026-04-06', '2026-03-30')).toBe('6 Apr');
  });
});
