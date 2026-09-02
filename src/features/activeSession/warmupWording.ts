import type { WarmupVolume } from '@/types/programTypes';

/**
 * Putting a warm-up dose into words.
 *
 * Its own file for the same reason `prescriptionWording.ts` is: the panel, the
 * step's own screen and the progress line all have to say "10 reps per side" the
 * same way, and three copies of that sentence is three places for it to drift.
 */

/** Two minutes and up reads better as minutes than as a count of seconds. */
const SECONDS_ABOVE_WHICH_MINUTES_READ_BETTER = 120;

/** "10 reps per side", "30 seconds", "4 minutes" — whichever the drill is counted in. */
export function describeWarmupVolume(volume: WarmupVolume): string {
  const perSideSuffix = volume.isPerSide ? ' per side' : '';

  if (volume.durationSeconds !== null) {
    if (volume.durationSeconds >= SECONDS_ABOVE_WHICH_MINUTES_READ_BETTER) {
      return `${String(Math.round(volume.durationSeconds / 60))} minutes${perSideSuffix}`;
    }

    return `${String(volume.durationSeconds)} seconds${perSideSuffix}`;
  }

  if (volume.reps !== null) {
    return `${String(volume.reps)} reps${perSideSuffix}`;
  }

  return 'as prescribed';
}

/**
 * "About 8 minutes".
 *
 * Rounded up to a whole minute rather than shown as `7:49`, because this answers
 * "have I got time for this" and a stopwatch reading next to the session clock
 * in the header reads like a second timer.
 */
export function describeEstimatedWarmupDuration(estimatedDurationSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(estimatedDurationSeconds / 60));

  return minutes === 1 ? 'About a minute' : `About ${String(minutes)} minutes`;
}

/**
 * "3 of 7 done", or the two ends of it said in words.
 *
 * The ends are worth spelling out. "0 of 7 done" is a discouraging first thing
 * to read, and "7 of 7 done" should read as an instruction to move on rather
 * than as a score.
 */
export function describeWarmupProgress(completedStepCount: number, totalStepCount: number): string {
  if (completedStepCount === 0) {
    return `${String(totalStepCount)} to work through`;
  }

  if (completedStepCount >= totalStepCount) {
    return 'All of them done';
  }

  return `${String(completedStepCount)} of ${String(totalStepCount)} done`;
}
