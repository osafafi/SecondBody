/**
 * What gets recorded outside the gym: the scale, the tape measure that does not
 * exist yet, and the four daily habits.
 *
 * Calendar days are ISO date strings (`2026-09-01`) rather than instants,
 * because "the day I weighed myself" is a date and not a moment — storing it as
 * one would make it move across midnight depending on the reader's time zone.
 */

/** `users/{userId}/bodyMetrics/{metricId}`. */
export type BodyMetricEntry = {
  /** ISO date, `YYYY-MM-DD`. */
  recordedOn: string;

  weightKilograms: number | null;

  /*
   * Optional from day one. Waist is a better fat-loss signal than the scale, so
   * the fields exist ready for a tape measure and the UI simply hides the empty
   * ones. A tape measure was recommended and declined — see the standing notes
   * in docs/PROGRESS.md. Do not nag about it.
   */
  waistCentimetres: number | null;
  chestCentimetres: number | null;
  hipsCentimetres: number | null;

  notes: string | null;

  createdAt: Date;
};

/**
 * `users/{userId}/dailyHabits/{yyyy-mm-dd}`.
 *
 * Keyed by date rather than a random id, so a given day can be read or written
 * directly without a query.
 */
export type DailyHabitRecord = {
  /** ISO date, `YYYY-MM-DD`. Always equal to the document id. */
  onDate: string;

  didHitProteinTarget: boolean;
  didAvoidLiquidCalories: boolean;
  didCompleteMobilityRoutine: boolean;

  /** Null means "not answered", which is different from a recorded zero. */
  stepCount: number | null;
  sleepHours: number | null;

  updatedAt: Date;
};

/** A blank day, for a checklist opened on a date nothing has been saved for. */
export function buildEmptyDailyHabitRecord(onDate: string, updatedAt: Date): DailyHabitRecord {
  return {
    onDate,
    didHitProteinTarget: false,
    didAvoidLiquidCalories: false,
    didCompleteMobilityRoutine: false,
    stepCount: null,
    sleepHours: null,
    updatedAt,
  };
}
