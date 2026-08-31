import { parseIsoDate } from '@/domain/calendarDates';
import type { BodyWeightTrendSummary, BodyWeightTrendVerdict } from '@/domain/bodyWeightTrend';
import type { TrainingVolumeComparison } from '@/domain/trainingVolumeTrend';

/**
 * Turning the progress numbers into the sentences the screen shows.
 *
 * Same rule as `todayWording.ts`: these are labels, not coach lines. Harout's
 * copy lives in `src/content/coachVoice/` and is fixed text chosen by category.
 * Nothing here can be a coach line, because every sentence below has a number
 * in it that only exists at runtime — "down 1.4 kg over three weeks" cannot be
 * written in advance. What these do borrow is the voice's rules: state the fact,
 * never moralise about it, and never dress a bad trend up as a good one.
 */

const DAY_AND_MONTH_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});

/** "6 Apr" — the axis label on the weight chart and the date on a record. */
export function formatShortDate(isoDate: string): string {
  return DAY_AND_MONTH_FORMATTER.format(parseIsoDate(isoDate));
}

/** "84.3 kg". One decimal place, because a bathroom scale has one. */
export function formatWeightKilograms(weightKilograms: number): string {
  return `${weightKilograms.toFixed(1)} kg`;
}

/**
 * "1.4 kg down" / "0.6 kg up" / "level".
 *
 * Direction as a word rather than a minus sign. A weight chart is read in a
 * hurry and "-1.4" is one glance away from being read as the weight itself.
 */
export function describeWeightChange(changeKilograms: number): string {
  const roundedChange = Math.round(changeKilograms * 10) / 10;

  if (roundedChange === 0) {
    return 'level';
  }

  return `${Math.abs(roundedChange).toFixed(1)} kg ${roundedChange < 0 ? 'down' : 'up'}`;
}

/**
 * The label under one column of the volume chart.
 *
 * The day of the month alone, except where the month has just changed, which
 * gets "2 Apr". Eight weeks spans three months and repeats the same day number
 * twice, so a column reading "16" against another column reading "16" is
 * ambiguous exactly where someone is trying to find last month.
 */
export function formatWeekColumnLabel(
  weekStartOn: string,
  previousWeekStartOn: string | null,
): string {
  const dayOfMonth = String(parseIsoDate(weekStartOn).getDate());

  const isNewMonth =
    previousWeekStartOn === null ||
    parseIsoDate(previousWeekStartOn).getMonth() !== parseIsoDate(weekStartOn).getMonth();

  return isNewMonth ? formatShortDate(weekStartOn) : dayOfMonth;
}

/** "12,400 kg" — volume totals get thousands separators and no decimals. */
export function formatVolumeKilograms(volumeKilograms: number): string {
  return `${Math.round(volumeKilograms).toLocaleString('en-GB')} kg`;
}

/**
 * The headline under the weight chart.
 *
 * Every branch is a statement of fact. The one that could be read as praise —
 * losing faster than planned — deliberately is not written as praise: on a
 * beginner programme that means muscle is going with the fat.
 */
export function describeBodyWeightTrend(summary: BodyWeightTrendSummary): string {
  const verdictDescriptions: Record<BodyWeightTrendVerdict, () => string> = {
    noReadings: () => 'Nothing on the scale yet. Log a weight and the trend starts building.',

    notEnoughReadings: () =>
      'Not enough weigh-ins yet to call a trend. A few more and this becomes a line worth reading.',

    tooEarlyToTell: () =>
      'Too early to read anything into the scale. The first few weeks pull water into muscle, so it barely moves — that is the plan working, not the plan failing.',

    onTrack: () => `${describeAverageAndChange(summary)} That is inside where it should be by now.`,

    behindExpectation: () =>
      `${describeAverageAndChange(summary)} That is heavier than the plan expected by now — worth a look at the habits rather than the training.`,

    aheadOfExpectation: () =>
      `${describeAverageAndChange(summary)} That is faster than planned, which is not automatically good news — losing quicker than half a kilo a week tends to take muscle with it.`,
  };

  return verdictDescriptions[summary.verdict]();
}

/** "The 7-day average is 87.8 kg, 2.2 kg down since you started." */
function describeAverageAndChange(summary: BodyWeightTrendSummary): string {
  if (summary.latestRollingAverageKilograms === null) {
    return '';
  }

  const average = formatWeightKilograms(summary.latestRollingAverageKilograms);

  if (summary.changeSinceStartKilograms === null || summary.changeSinceStartKilograms === 0) {
    return `The 7-day average is ${average}.`;
  }

  return `The 7-day average is ${average}, ${describeWeightChange(
    summary.changeSinceStartKilograms,
  )} since you started.`;
}

/**
 * The line under the volume chart.
 *
 * Null when there is nothing worth saying, which the panel renders as nothing at
 * all rather than as a placeholder.
 */
export function describeVolumeComparison(
  comparison: TrainingVolumeComparison | null,
): string | null {
  if (!comparison) {
    return null;
  }

  if (comparison.latestWeek.sessionCount === 0) {
    return 'Nothing logged this week yet.';
  }

  if (comparison.changeRatio === null) {
    return 'First week back after a week off. Do not chase the number — the sessions are the point.';
  }

  const changePercent = Math.abs(Math.round(comparison.changeRatio * 100));

  if (changePercent < 5) {
    return 'About the same amount of work as last week.';
  }

  return comparison.changeRatio > 0
    ? `${String(changePercent)}% more work than last week.`
    : `${String(changePercent)}% less work than last week.`;
}

/** "3 sets of 40 kg" is not this. "40 kg x 10" is — how a record reads. */
export function formatRecordEffort(
  bestWeightKilograms: number,
  bestRepsAtBestWeight: number,
): string {
  return `${formatWeightKilograms(bestWeightKilograms)} × ${String(bestRepsAtBestWeight)}`;
}
