/**
 * What the scale is going to do, and when to say so.
 *
 * From docs/TRAINING_PROGRAM.md section 11:
 *
 * > The scale will barely move for the first 2-3 weeks — and it may go UP.
 *
 * New training pulls water and glycogen into muscle. It is a good sign wearing a
 * bad disguise, and it is the single most common reason a beginner quits in week
 * three — which is why the app has to raise it before it is asked, rather than
 * waiting for someone to come looking for reassurance they have already decided
 * not to believe.
 */

/** The last week of the programme in which the reassurance is surfaced unprompted. */
export const FINAL_WEEK_FOR_EARLY_SCALE_REASSURANCE = 3;

/**
 * Expected rate of loss once it starts moving. Faster than this and muscle goes
 * with the fat, which is the opposite of the point.
 */
export const EXPECTED_WEEKLY_WEIGHT_CHANGE_KILOGRAMS = {
  slowest: 0.4,
  fastest: 0.5,
} as const;

/**
 * Whether to raise the water-weight explanation without being asked.
 *
 * Weeks 1 to 3 only. After that it is nagging, and after that it is also no
 * longer true.
 */
export function shouldSurfaceEarlyScaleReassurance(weekNumber: number): boolean {
  return weekNumber >= 1 && weekNumber <= FINAL_WEEK_FOR_EARLY_SCALE_REASSURANCE;
}

export type ExpectedWeightRangeKilograms = {
  heaviest: number;
  lightest: number;
};

/**
 * Where the weight should reasonably be after a number of weeks.
 *
 * The reassurance window is deliberately included in the projection as no loss
 * at all: expecting nothing for the first three weeks is what makes the first
 * three weeks survivable. Both ends are rounded to one decimal place, because a
 * bathroom scale does not pretend to more precision than that and neither should
 * this.
 */
export function projectExpectedWeightRangeKilograms(
  startingWeightKilograms: number,
  weeksElapsed: number,
): ExpectedWeightRangeKilograms {
  const weeksOfExpectedLoss = Math.max(0, weeksElapsed - FINAL_WEEK_FOR_EARLY_SCALE_REASSURANCE);

  const smallestLoss = weeksOfExpectedLoss * EXPECTED_WEEKLY_WEIGHT_CHANGE_KILOGRAMS.slowest;
  const largestLoss = weeksOfExpectedLoss * EXPECTED_WEEKLY_WEIGHT_CHANGE_KILOGRAMS.fastest;

  return {
    heaviest: Math.round((startingWeightKilograms - smallestLoss) * 10) / 10,
    lightest: Math.round((startingWeightKilograms - largestLoss) * 10) / 10,
  };
}
