/**
 * The daily habit targets that move.
 *
 * Protein, liquid calories and sleep are fixed numbers and live in
 * `src/content/habits/`. Steps are the exception: the target climbs from 5,000
 * to 9,000 across the twelve weeks, because asking a sedentary person for 9,000
 * steps in week one is how you get a person who does 3,000 steps and feels bad
 * about it.
 *
 * See docs/TRAINING_PROGRAM.md section 9.
 */

/** Step targets are rounded to this, so the number on screen is a round one. */
const STEP_TARGET_ROUNDING = 250;

export type StepTargetRampInput = {
  weekNumber: number;
  totalWeekCount: number;
  startingDailyStepTarget: number;
  finalDailyStepTarget: number;
};

/**
 * The daily step target for a given week, ramped linearly between the first
 * week's target and the last week's.
 *
 * Weeks outside the programme are clamped rather than extrapolated: before it
 * starts you get the starting target, after it ends you keep the final one.
 */
export function calculateDailyStepTarget(input: StepTargetRampInput): number {
  const { weekNumber, totalWeekCount, startingDailyStepTarget, finalDailyStepTarget } = input;

  if (totalWeekCount <= 1) {
    return finalDailyStepTarget;
  }

  const clampedWeekNumber = Math.min(Math.max(weekNumber, 1), totalWeekCount);
  const progressThroughProgramme = (clampedWeekNumber - 1) / (totalWeekCount - 1);

  const rawTarget =
    startingDailyStepTarget +
    (finalDailyStepTarget - startingDailyStepTarget) * progressThroughProgramme;

  return Math.round(rawTarget / STEP_TARGET_ROUNDING) * STEP_TARGET_ROUNDING;
}

/** True when the day's steps met the target for that week. */
export function hasMetDailyStepTarget(stepCount: number | null, dailyStepTarget: number): boolean {
  return stepCount !== null && stepCount >= dailyStepTarget;
}

/** True when the night's sleep met the target. */
export function hasMetNightlySleepTarget(
  sleepHours: number | null,
  nightlySleepTargetHours: number,
): boolean {
  return sleepHours !== null && sleepHours >= nightlySleepTargetHours;
}
