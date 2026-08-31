/**
 * Coming back after time away.
 *
 * The rail, from docs/TRAINING_PROGRAM.md section 12:
 *
 * > After a gap of 10+ days, restart at the beginning of the current phase at
 * > 80% load rather than resuming where he left off.
 *
 * This exists because the alternative — picking up exactly where the numbers
 * left off after a fortnight away — is one of the more reliable ways to get hurt
 * in the first session back, and because the first session back is the one that
 * decides whether there is a second one.
 */

/** A gap of this many days or more triggers the restart. */
export const LAYOFF_THRESHOLD_DAYS = 10;

/** Loads are multiplied by this on the way back in. */
export const LAYOFF_LOAD_MULTIPLIER = 0.8;

export type LayoffAdjustment = {
  /** True when the gap was long enough to change anything. */
  isReturningFromLayoff: boolean;

  /** True when the current phase should begin again from its first week. */
  shouldRestartCurrentPhase: boolean;

  /** Multiplied into every prescribed load. 1 when nothing is being adjusted. */
  loadMultiplier: number;

  /** Whole days since the last completed session. 0 when there has never been one. */
  daysSinceLastSession: number;
};

/**
 * What to do about a gap.
 *
 * A brand new user is not returning from a layoff — there is nothing to return
 * from — so they get the untouched programme.
 */
export function determineLayoffAdjustment(daysSinceLastSession: number | null): LayoffAdjustment {
  if (daysSinceLastSession === null) {
    return {
      isReturningFromLayoff: false,
      shouldRestartCurrentPhase: false,
      loadMultiplier: 1,
      daysSinceLastSession: 0,
    };
  }

  const isReturningFromLayoff = daysSinceLastSession >= LAYOFF_THRESHOLD_DAYS;

  return {
    isReturningFromLayoff,
    shouldRestartCurrentPhase: isReturningFromLayoff,
    loadMultiplier: isReturningFromLayoff ? LAYOFF_LOAD_MULTIPLIER : 1,
    daysSinceLastSession,
  };
}
