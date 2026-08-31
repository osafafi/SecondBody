/**
 * Estimating a one-rep max from a set that was actually performed.
 *
 * Nobody in this programme will ever attempt a true one-rep max — it is exactly
 * the wrong thing for a beginner with four aching joints. The estimate exists
 * because it is the only fair way to compare "60 kg for 8" against "50 kg for
 * 12" when deciding whether something was a personal record.
 *
 * Epley's formula, which is the usual choice for the 1-10 rep range this app
 * ever sees:
 *
 *     estimated 1RM = weight x (1 + reps / 30)
 *
 * It is an estimate. Treat a 2% difference between two of these as noise.
 */

const EPLEY_REP_DIVISOR = 30;

/**
 * The estimated one-rep max for a set, rounded to one decimal place.
 *
 * Returns 0 for a set that was not really a set — no reps, or no load — rather
 * than throwing, because a failed set is a normal thing to log and it should not
 * take the progress screen down with it.
 */
export function calculateEstimatedOneRepMaxKilograms(
  weightKilograms: number,
  reps: number,
): number {
  if (weightKilograms <= 0 || reps <= 0) {
    return 0;
  }

  const estimate = weightKilograms * (1 + reps / EPLEY_REP_DIVISOR);

  return Math.round(estimate * 10) / 10;
}

/**
 * Whether a set beats a stored personal record.
 *
 * Compared on estimated one-rep max rather than on raw weight, so that grinding
 * out two extra reps at the same weight counts as the progress it actually is.
 */
export function isNewPersonalRecord(
  candidateWeightKilograms: number,
  candidateReps: number,
  bestEstimatedOneRepMaxKilograms: number,
): boolean {
  const candidateEstimate = calculateEstimatedOneRepMaxKilograms(
    candidateWeightKilograms,
    candidateReps,
  );

  return candidateEstimate > bestEstimatedOneRepMaxKilograms;
}
