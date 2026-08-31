import { describe, expect, it } from 'vitest';

import {
  BODY_WEIGHT_ROLLING_AVERAGE_DAYS,
  buildBodyWeightTrendSeries,
  calculateWeeklyChangeKilograms,
  summariseBodyWeightTrend,
  type BodyWeightObservation,
} from './bodyWeightTrend';

/**
 * The rule these tests exist to protect: the headline number is an average, not
 * a reading. Every case below where the two disagree is a case where showing the
 * reading would have been demoralising and wrong.
 */

function buildObservations(
  weightsByDate: Record<string, number | number[]>,
): BodyWeightObservation[] {
  return Object.entries(weightsByDate).flatMap(([onDate, weights]) =>
    (Array.isArray(weights) ? weights : [weights]).map((weightKilograms) => ({
      onDate,
      weightKilograms,
    })),
  );
}

describe('buildBodyWeightTrendSeries', () => {
  it('returns nothing when nothing has been weighed', () => {
    expect(buildBodyWeightTrendSeries([])).toEqual([]);
  });

  it('averages a single reading with itself', () => {
    expect(buildBodyWeightTrendSeries(buildObservations({ '2026-04-06': 90 }))).toEqual([
      { onDate: '2026-04-06', recordedWeightKilograms: 90, rollingAverageKilograms: 90 },
    ]);
  });

  it('sorts readings that arrive out of order', () => {
    const series = buildBodyWeightTrendSeries(
      buildObservations({ '2026-04-08': 89, '2026-04-06': 90, '2026-04-07': 91 }),
    );

    expect(series.map((point) => point.onDate)).toEqual(['2026-04-06', '2026-04-07', '2026-04-08']);
  });

  it('averages two weigh-ins on the same day rather than picking one', () => {
    const series = buildBodyWeightTrendSeries(buildObservations({ '2026-04-06': [90, 91] }));

    expect(series[0]?.recordedWeightKilograms).toBe(90.5);
  });

  it('smooths a single water-weight spike out of the headline', () => {
    /*
     * The case the whole module exists for. Thursday's scale says 92 after a
     * salty dinner. The average says 90.4, which is the truth.
     */
    const series = buildBodyWeightTrendSeries(
      buildObservations({
        '2026-04-06': 90,
        '2026-04-07': 89.8,
        '2026-04-08': 90,
        '2026-04-09': 92,
      }),
    );

    const thursday = series[3];

    expect(thursday?.recordedWeightKilograms).toBe(92);
    expect(thursday?.rollingAverageKilograms).toBe(90.5);
  });

  it('measures the window in days, so a gap does not reach further back', () => {
    /*
     * Two readings a fortnight apart. The later one must average only itself —
     * a count-based window would average it against a weight from two weeks ago
     * and draw a line that never moved.
     */
    const series = buildBodyWeightTrendSeries(
      buildObservations({ '2026-04-06': 90, '2026-04-20': 88 }),
    );

    expect(series[1]?.rollingAverageKilograms).toBe(88);
  });

  it('keeps exactly the days inside the window', () => {
    const observations = buildObservations({
      '2026-04-01': 100,
      '2026-04-07': 90,
    });

    // Six days apart, so both are inside a seven day window.
    expect(buildBodyWeightTrendSeries(observations)[1]?.rollingAverageKilograms).toBe(95);

    // One day narrower and the older reading falls out of it.
    expect(buildBodyWeightTrendSeries(observations, 6)[1]?.rollingAverageKilograms).toBe(90);
  });

  it('defaults to a seven day window', () => {
    expect(BODY_WEIGHT_ROLLING_AVERAGE_DAYS).toBe(7);
  });
});

describe('calculateWeeklyChangeKilograms', () => {
  it('has nothing to say about a single reading', () => {
    expect(
      calculateWeeklyChangeKilograms(
        buildBodyWeightTrendSeries(buildObservations({ '2026-04-06': 90 })),
      ),
    ).toBeNull();
  });

  it('has nothing to say when every reading is on one day', () => {
    expect(
      calculateWeeklyChangeKilograms(
        buildBodyWeightTrendSeries(buildObservations({ '2026-04-06': [90, 91] })),
      ),
    ).toBeNull();
  });

  it('reports a loss as a negative number', () => {
    const series = buildBodyWeightTrendSeries(
      buildObservations({ '2026-04-06': 90, '2026-04-13': 89.5 }),
    );

    /*
     * Seven days apart is *outside* a seven day window, so the later average is
     * the later reading alone: half a kilogram across a week.
     */
    expect(calculateWeeklyChangeKilograms(series)).toBe(-0.5);
  });

  it('softens a raw drop when the readings are close enough to average together', () => {
    const series = buildBodyWeightTrendSeries(
      buildObservations({ '2026-04-06': 90, '2026-04-10': 89.5 }),
    );

    // 89.75 against 90 across four days, scaled up to a week.
    expect(calculateWeeklyChangeKilograms(series)).toBe(-0.4);
  });

  it('scales a fortnight down to a weekly rate', () => {
    const series = buildBodyWeightTrendSeries(
      buildObservations({ '2026-04-06': 90, '2026-04-20': 89 }),
    );

    expect(calculateWeeklyChangeKilograms(series)).toBe(-0.5);
  });
});

describe('summariseBodyWeightTrend', () => {
  const startingWeightKilograms = 90;
  const targetWeightKilograms = 80;

  it('says so when nothing has been logged', () => {
    const summary = summariseBodyWeightTrend({
      observations: [],
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 6,
    });

    expect(summary.verdict).toBe('noReadings');
    expect(summary.latestRollingAverageKilograms).toBeNull();
    expect(summary.changeSinceStartKilograms).toBeNull();
  });

  it('refuses to judge the first three weeks, however much data there is', () => {
    const summary = summariseBodyWeightTrend({
      observations: buildObservations({
        '2026-04-06': 90,
        '2026-04-07': 90.4,
        '2026-04-08': 90.6,
        '2026-04-09': 91,
      }),
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 2,
    });

    expect(summary.verdict).toBe('tooEarlyToTell');
  });

  it('will not draw a trend from two readings', () => {
    const summary = summariseBodyWeightTrend({
      observations: buildObservations({ '2026-04-06': 90, '2026-04-07': 89.8 }),
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 8,
    });

    expect(summary.verdict).toBe('notEnoughReadings');
  });

  it('calls a weight inside the expected band on track', () => {
    // Eight weeks in: five weeks of expected loss, so 87.5 to 88.
    const summary = summariseBodyWeightTrend({
      observations: buildObservations({
        '2026-04-06': 87.8,
        '2026-04-07': 87.8,
        '2026-04-08': 87.8,
      }),
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 8,
    });

    expect(summary.expectedRange).toEqual({ heaviest: 88, lightest: 87.5 });
    expect(summary.verdict).toBe('onTrack');
  });

  it('calls a weight above the band behind expectation', () => {
    const summary = summariseBodyWeightTrend({
      observations: buildObservations({
        '2026-04-06': 89.5,
        '2026-04-07': 89.5,
        '2026-04-08': 89.5,
      }),
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 8,
    });

    expect(summary.verdict).toBe('behindExpectation');
  });

  it('calls a weight below the band ahead of expectation, which is not praise', () => {
    /*
     * Faster than half a kilo a week on a beginner programme means muscle is
     * going with the fat. The verdict states the fact and nothing more — see the
     * note on `decideVerdict`.
     */
    const summary = summariseBodyWeightTrend({
      observations: buildObservations({
        '2026-04-06': 85,
        '2026-04-07': 85,
        '2026-04-08': 85,
      }),
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 8,
    });

    expect(summary.verdict).toBe('aheadOfExpectation');
  });

  it('measures the change from the starting weight, not from the first weigh-in', () => {
    const summary = summariseBodyWeightTrend({
      observations: buildObservations({
        '2026-04-06': 88,
        '2026-04-07': 88,
        '2026-04-08': 88,
      }),
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 8,
    });

    expect(summary.changeSinceStartKilograms).toBe(-2);
  });

  it('stops counting down to the target once it is passed', () => {
    const summary = summariseBodyWeightTrend({
      observations: buildObservations({ '2026-04-06': 78 }),
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 30,
    });

    expect(summary.remainingToTargetKilograms).toBe(0);
  });

  it('reports what is left to lose', () => {
    const summary = summariseBodyWeightTrend({
      observations: buildObservations({ '2026-04-06': 85.5 }),
      startingWeightKilograms,
      targetWeightKilograms,
      weeksElapsed: 8,
    });

    expect(summary.remainingToTargetKilograms).toBe(5.5);
  });
});
