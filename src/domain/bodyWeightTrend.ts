import {
  projectExpectedWeightRangeKilograms,
  shouldSurfaceEarlyScaleReassurance,
  type ExpectedWeightRangeKilograms,
} from './bodyWeightExpectations';
import { countCalendarDaysBetween, parseIsoDate } from './calendarDates';

/**
 * The scale, read the only way it is safe to read it.
 *
 * A raw daily weight is mostly water. It swings a kilogram either way on salt,
 * sleep and how recently someone drank a litre of anything, and a chart of it is
 * the single most reliable way to make a person quit in week three. So the line
 * this app leads with is a **seven day rolling average**, and the raw readings
 * sit behind it as faint dots rather than as the headline.
 *
 * See docs/TRAINING_PROGRAM.md section 11, and `bodyWeightExpectations.ts` for
 * where the weight is *supposed* to be. This module is the measurement; that one
 * is the expectation. Keeping them apart means the projection can be tested
 * without inventing weigh-ins, and the average can be tested without a
 * programme.
 */

/** The window the headline average is taken over. */
export const BODY_WEIGHT_ROLLING_AVERAGE_DAYS = 7;

/**
 * Below this many separate days, a rolling average is just the readings again
 * with extra confidence, so the app says so rather than drawing a trend.
 */
export const MINIMUM_DAYS_FOR_A_TREND = 3;

/** One weigh-in, as the domain sees it: a day and a number. */
export type BodyWeightObservation = {
  /** ISO `YYYY-MM-DD`, in the local calendar. */
  onDate: string;

  weightKilograms: number;
};

export type BodyWeightTrendPoint = {
  onDate: string;

  /** The scale reading for that day. Two weigh-ins on one day are averaged. */
  recordedWeightKilograms: number;

  /** The mean of every reading in the window ending on this day, inclusive. */
  rollingAverageKilograms: number;
};

/**
 * What the trend is doing relative to what was promised.
 *
 * `tooEarlyToTell` is a real and important answer rather than a missing one —
 * for the first three weeks the honest read is that nothing has happened yet and
 * that is the plan working.
 */
export type BodyWeightTrendVerdict =
  | 'noReadings'
  | 'notEnoughReadings'
  | 'tooEarlyToTell'
  | 'aheadOfExpectation'
  | 'onTrack'
  | 'behindExpectation';

export type BodyWeightTrendSummary = {
  /** Oldest first, which is the direction a chart is drawn in. */
  series: BodyWeightTrendPoint[];

  /** The most recent scale reading, or null when nothing has been logged. */
  latestRecordedWeightKilograms: number | null;

  /** The headline number. Null until there is anything to average. */
  latestRollingAverageKilograms: number | null;

  /** Negative means weight has come off. Measured from the profile's starting weight. */
  changeSinceStartKilograms: number | null;

  /** Rate of change across the whole series, from rolling average to rolling average. */
  weeklyChangeKilograms: number | null;

  /** Still to lose to reach the target. Zero once the target is met or passed. */
  remainingToTargetKilograms: number | null;

  expectedRange: ExpectedWeightRangeKilograms;

  verdict: BodyWeightTrendVerdict;
};

export type BodyWeightTrendInput = {
  /** In any order. Duplicated days are averaged rather than one being discarded. */
  observations: readonly BodyWeightObservation[];

  startingWeightKilograms: number;
  targetWeightKilograms: number;

  /** Whole weeks since the programme started. Drives the expected range. */
  weeksElapsed: number;

  rollingWindowDays?: number;
};

function roundToOneDecimalPlace(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculateMean(values: readonly number[]): number {
  return values.reduce((runningTotal, value) => runningTotal + value, 0) / values.length;
}

/**
 * One reading per day, oldest first.
 *
 * Two weigh-ins on one day are averaged rather than resolved by picking one.
 * The repository appends both on purpose — see `bodyMetricsRepository` — and
 * deciding after the fact that the second one "counted" would be a judgement
 * this layer has no basis for.
 */
function collapseObservationsToOnePerDay(
  observations: readonly BodyWeightObservation[],
): BodyWeightObservation[] {
  const weightsByDate = new Map<string, number[]>();

  for (const observation of observations) {
    const weightsForDay = weightsByDate.get(observation.onDate) ?? [];

    weightsForDay.push(observation.weightKilograms);
    weightsByDate.set(observation.onDate, weightsForDay);
  }

  return [...weightsByDate.entries()]
    .map(([onDate, weights]) => ({
      onDate,
      weightKilograms: roundToOneDecimalPlace(calculateMean(weights)),
    }))
    .sort((earlier, later) => earlier.onDate.localeCompare(later.onDate));
}

/**
 * The rolling average series, oldest first.
 *
 * The window is measured **in days, not in readings**, so a week with three
 * weigh-ins and a week with seven both average over the same span of time. A
 * count-based window would quietly stretch back a month during a lazy fortnight
 * and make the line look far smoother than the data behind it.
 */
export function buildBodyWeightTrendSeries(
  observations: readonly BodyWeightObservation[],
  rollingWindowDays: number = BODY_WEIGHT_ROLLING_AVERAGE_DAYS,
): BodyWeightTrendPoint[] {
  const dailyObservations = collapseObservationsToOnePerDay(observations);

  return dailyObservations.map((observation, observationIndex) => {
    const windowEnd = parseIsoDate(observation.onDate);

    const weightsInWindow = dailyObservations
      .slice(0, observationIndex + 1)
      .filter(
        (candidate) =>
          countCalendarDaysBetween(parseIsoDate(candidate.onDate), windowEnd) < rollingWindowDays,
      )
      .map((candidate) => candidate.weightKilograms);

    return {
      onDate: observation.onDate,
      recordedWeightKilograms: observation.weightKilograms,
      rollingAverageKilograms: roundToOneDecimalPlace(calculateMean(weightsInWindow)),
    };
  });
}

/**
 * Change per week across the series, measured on the averages.
 *
 * Null when there is nothing to measure across — one point, or several readings
 * all on the same day. Measured on the rolling average rather than on the raw
 * readings so that a single dehydrated Monday does not become a rate of loss.
 */
export function calculateWeeklyChangeKilograms(
  series: readonly BodyWeightTrendPoint[],
): number | null {
  const firstPoint = series[0];
  const lastPoint = series[series.length - 1];

  if (!firstPoint || !lastPoint) {
    return null;
  }

  const elapsedDays = countCalendarDaysBetween(
    parseIsoDate(firstPoint.onDate),
    parseIsoDate(lastPoint.onDate),
  );

  if (elapsedDays <= 0) {
    return null;
  }

  const totalChange = lastPoint.rollingAverageKilograms - firstPoint.rollingAverageKilograms;

  return roundToOneDecimalPlace((totalChange / elapsedDays) * 7);
}

/**
 * Where the trend sits against the expected range.
 *
 * "Ahead" means lighter than the fastest expected loss. That is deliberately
 * **not** treated as good news anywhere this is rendered — losing faster than
 * half a kilogram a week on a beginner programme means muscle is going with the
 * fat, which is the opposite of the point. The verdict states the fact; the
 * wording decides what to do about it.
 */
function decideVerdict(
  latestRollingAverageKilograms: number,
  expectedRange: ExpectedWeightRangeKilograms,
): BodyWeightTrendVerdict {
  if (latestRollingAverageKilograms < expectedRange.lightest) {
    return 'aheadOfExpectation';
  }

  if (latestRollingAverageKilograms > expectedRange.heaviest) {
    return 'behindExpectation';
  }

  return 'onTrack';
}

/**
 * Which verdict applies once the series has been built.
 *
 * Order matters. The first three weeks are exempt from judgement entirely, even
 * when there is plenty of data, because there is nothing to judge yet.
 */
function decideTrendVerdict(
  series: readonly BodyWeightTrendPoint[],
  latestRollingAverageKilograms: number,
  expectedRange: ExpectedWeightRangeKilograms,
  weeksElapsed: number,
): BodyWeightTrendVerdict {
  if (shouldSurfaceEarlyScaleReassurance(weeksElapsed)) {
    return 'tooEarlyToTell';
  }

  if (series.length < MINIMUM_DAYS_FOR_A_TREND) {
    return 'notEnoughReadings';
  }

  return decideVerdict(latestRollingAverageKilograms, expectedRange);
}

/** Everything the progress screen needs to draw and describe the scale. */
export function summariseBodyWeightTrend(input: BodyWeightTrendInput): BodyWeightTrendSummary {
  const series = buildBodyWeightTrendSeries(
    input.observations,
    input.rollingWindowDays ?? BODY_WEIGHT_ROLLING_AVERAGE_DAYS,
  );

  const expectedRange = projectExpectedWeightRangeKilograms(
    input.startingWeightKilograms,
    input.weeksElapsed,
  );

  const latestPoint = series[series.length - 1];

  if (!latestPoint) {
    return {
      series,
      latestRecordedWeightKilograms: null,
      latestRollingAverageKilograms: null,
      changeSinceStartKilograms: null,
      weeklyChangeKilograms: null,
      remainingToTargetKilograms: null,
      expectedRange,
      verdict: 'noReadings',
    };
  }

  const latestRollingAverageKilograms = latestPoint.rollingAverageKilograms;

  return {
    series,
    latestRecordedWeightKilograms: latestPoint.recordedWeightKilograms,
    latestRollingAverageKilograms,
    changeSinceStartKilograms: roundToOneDecimalPlace(
      latestRollingAverageKilograms - input.startingWeightKilograms,
    ),
    weeklyChangeKilograms: calculateWeeklyChangeKilograms(series),
    remainingToTargetKilograms: Math.max(
      0,
      roundToOneDecimalPlace(latestRollingAverageKilograms - input.targetWeightKilograms),
    ),
    expectedRange,
    verdict: decideTrendVerdict(
      series,
      latestRollingAverageKilograms,
      expectedRange,
      input.weeksElapsed,
    ),
  };
}
