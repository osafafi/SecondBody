import { addLocalDays, formatIsoDate, startOfLocalWeek } from './calendarDates';

/**
 * Training volume, grouped into weeks.
 *
 * `sessionVolume.ts` answers "how much work was that session". This answers "is
 * there more work happening this month than last", which is the only question
 * the progress screen can honestly ask of volume — a single session's total
 * swings on whether the leg press was in it, and comparing two sessions of
 * different letters says nothing at all.
 *
 * Weeks rather than sessions for the same reason: three sessions a week means a
 * week is a complete rotation of A, B and C, so weeks are comparable with each
 * other in a way sessions are not.
 *
 * **Empty weeks are kept.** A fortnight off is the most important thing a volume
 * chart can show, and dropping the blank bars would draw it as an unbroken climb.
 */

/** A session that counted: finished, with its denormalised total. */
export type CompletedSessionVolume = {
  completedAt: Date;
  totalVolumeKilograms: number;
};

export type TrainingVolumeWeek = {
  /** ISO `YYYY-MM-DD` of the first day of the week. */
  weekStartOn: string;

  totalVolumeKilograms: number;

  /** Sessions finished that week. Zero for a week nothing happened in. */
  sessionCount: number;
};

export type TrainingVolumeTrendInput = {
  completedSessions: readonly CompletedSessionVolume[];

  /** Today. Passed in — nothing in `src/domain/` reads a clock. */
  now: Date;

  /** How many weeks the chart covers, ending with the week `now` falls in. */
  weekCount: number;

  /** `Date.getDay()` numbering, where 0 is Sunday. The app passes 1. */
  firstDayOfWeek: number;
};

function roundToOneDecimalPlace(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * The last `weekCount` weeks, oldest first, with every session bucketed into one.
 *
 * Sessions older than the window are dropped rather than piled into the first
 * bar, which would make the oldest week look like a heroic one.
 */
export function groupTrainingVolumeByWeek(input: TrainingVolumeTrendInput): TrainingVolumeWeek[] {
  const currentWeekStart = startOfLocalWeek(input.now, input.firstDayOfWeek);

  const weeks: TrainingVolumeWeek[] = [];

  for (let weeksBack = input.weekCount - 1; weeksBack >= 0; weeksBack -= 1) {
    weeks.push({
      weekStartOn: formatIsoDate(addLocalDays(currentWeekStart, -weeksBack * 7)),
      totalVolumeKilograms: 0,
      sessionCount: 0,
    });
  }

  for (const session of input.completedSessions) {
    const sessionWeekStartOn = formatIsoDate(
      startOfLocalWeek(session.completedAt, input.firstDayOfWeek),
    );

    const week = weeks.find((candidate) => candidate.weekStartOn === sessionWeekStartOn);

    if (!week) {
      continue;
    }

    week.totalVolumeKilograms = roundToOneDecimalPlace(
      week.totalVolumeKilograms + session.totalVolumeKilograms,
    );
    week.sessionCount += 1;
  }

  return weeks;
}

export type TrainingVolumeComparison = {
  latestWeek: TrainingVolumeWeek;
  previousWeek: TrainingVolumeWeek;

  changeKilograms: number;

  /** Positive means more work than last week. Null when last week was empty. */
  changeRatio: number | null;
};

/**
 * This week against last week.
 *
 * Null when there are not two weeks to compare. The ratio is separately nullable
 * because dividing by an empty week is not a thousand per cent improvement, it
 * is an undefined one — the caller should say "first week back", not "+∞%".
 */
export function compareLatestWeekToPrevious(
  weeks: readonly TrainingVolumeWeek[],
): TrainingVolumeComparison | null {
  const latestWeek = weeks[weeks.length - 1];
  const previousWeek = weeks[weeks.length - 2];

  if (!latestWeek || !previousWeek) {
    return null;
  }

  const changeKilograms = roundToOneDecimalPlace(
    latestWeek.totalVolumeKilograms - previousWeek.totalVolumeKilograms,
  );

  return {
    latestWeek,
    previousWeek,
    changeKilograms,
    changeRatio:
      previousWeek.totalVolumeKilograms > 0
        ? roundToOneDecimalPlace(changeKilograms / previousWeek.totalVolumeKilograms)
        : null,
  };
}

/** The heaviest week in the window, or null when nothing was trained in it. */
export function findHeaviestWeek(weeks: readonly TrainingVolumeWeek[]): TrainingVolumeWeek | null {
  return weeks.reduce<TrainingVolumeWeek | null>((heaviest, week) => {
    if (week.totalVolumeKilograms <= 0) {
      return heaviest;
    }

    return heaviest === null || week.totalVolumeKilograms > heaviest.totalVolumeKilograms
      ? week
      : heaviest;
  }, null);
}

/** Everything moved across the window. */
export function calculateTotalVolumeKilograms(weeks: readonly TrainingVolumeWeek[]): number {
  return roundToOneDecimalPlace(
    weeks.reduce((runningTotal, week) => runningTotal + week.totalVolumeKilograms, 0),
  );
}
