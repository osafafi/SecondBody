/**
 * The daily habits, as content.
 *
 * Four checkboxes and two numbers. Nothing is weighed, logged or counted beyond
 * this: high compliance beats high precision, and a food diary is the single
 * most common reason a beginner quits. See docs/TRAINING_PROGRAM.md section 9.
 */

/**
 * The habits tracked each day.
 *
 * Each id is the name of its field on the `dailyHabits/{yyyy-mm-dd}` document in
 * docs/DATA_MODEL.md, so the checklist maps onto storage without a translation
 * table in between.
 */
export const DAILY_HABIT_IDS = [
  'didHitProteinTarget',
  'didAvoidLiquidCalories',
  'didCompleteMobilityRoutine',
  'stepCount',
  'sleepHours',
] as const;

export type DailyHabitId = (typeof DAILY_HABIT_IDS)[number];

/**
 * How a habit is answered: a tick, or a number typed in.
 *
 * Steps and sleep are numeric because their targets move — the step target
 * climbs across the twelve weeks — and because "how far off was I" is a more
 * useful thing to see than a red cross.
 */
export type DailyHabitAnswerKind = 'checkbox' | 'number';

export type DailyHabitDefinition = {
  habitId: DailyHabitId;

  /** Short label for the checklist row. */
  displayName: string;

  answerKind: DailyHabitAnswerKind;

  /**
   * The target as it should be read on screen, e.g. "150 g" or "7 hours".
   * Null for the step target, which changes week by week and is calculated by
   * `src/domain/habitTargets.ts` instead.
   */
  staticTargetLabel: string | null;

  /** The unit shown next to a numeric answer. Null for checkbox habits. */
  unitLabel: string | null;

  /** Why this habit and not another one. Shown when the row is expanded. */
  whyItMatters: string;

  /**
   * Ordering on the checklist, most important first. Protein is first
   * deliberately: if only one habit survives a bad week, it should be that one.
   */
  orderIndex: number;
};
