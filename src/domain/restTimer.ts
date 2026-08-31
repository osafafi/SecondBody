/**
 * The rest timer, as arithmetic.
 *
 * Rest is training. Ninety seconds means ninety seconds, and the reason the app
 * counts it rather than trusting a guess is that a rushed rest turns a
 * prescribed set into a harder one than the programme asked for — which then
 * feeds the auto-regulation and drags the next session's load down for no good
 * reason.
 *
 * Nothing here reads a clock. `now` is passed in, which is what makes "what
 * happens when the phone sleeps for four minutes" a test rather than something
 * discovered in a gym.
 */

const SECONDS_PER_MINUTE = 60;

export type RestTimerReading = {
  elapsedSeconds: number;

  /** Counts down to 0 and stops there. Never negative. */
  remainingSeconds: number;

  /** True once the target has been reached. */
  hasReachedTarget: boolean;

  /**
   * How far past the target the rest has run. 0 until the target is reached.
   *
   * Shown rather than hidden: standing around for four minutes between sets is
   * worth knowing about, and a timer that silently stops at zero hides it.
   */
  overrunSeconds: number;

  /** 0 to 1, for the progress ring. Clamped, so an overrun stays full. */
  completedFraction: number;
};

/** Where a rest that began at `restStartedAt` has got to. */
export function readRestTimer(
  restStartedAt: Date,
  restTargetSeconds: number,
  now: Date,
): RestTimerReading {
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - restStartedAt.getTime()) / 1000));

  const remainingSeconds = Math.max(0, restTargetSeconds - elapsedSeconds);
  const hasReachedTarget = elapsedSeconds >= restTargetSeconds;

  return {
    elapsedSeconds,
    remainingSeconds,
    hasReachedTarget,
    overrunSeconds: hasReachedTarget ? elapsedSeconds - restTargetSeconds : 0,
    completedFraction: restTargetSeconds <= 0 ? 1 : Math.min(1, elapsedSeconds / restTargetSeconds),
  };
}

/**
 * `m:ss`, the way a stopwatch reads.
 *
 * Minutes are not padded and seconds always are, because "1:05" is a duration
 * and "01:05" is a video player. Anything an hour or longer is not a rest, so it
 * simply keeps counting the minutes rather than growing an hours field.
 */
export function formatDurationAsMinutesAndSeconds(totalSeconds: number): string {
  const safeTotalSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeTotalSeconds / SECONDS_PER_MINUTE);
  const seconds = safeTotalSeconds % SECONDS_PER_MINUTE;

  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

/**
 * How long the rest before a set actually was, for the session record.
 *
 * Null when there was no rest to measure — the first set of an exercise, or a
 * set logged with the timer never having run. `PerformedSet.restSecondsTaken`
 * is nullable precisely so that "no rest was measured" and "no rest was taken"
 * stay different facts.
 */
export function measureRestSecondsTaken(restStartedAt: Date | null, now: Date): number | null {
  if (restStartedAt === null) {
    return null;
  }

  return Math.max(0, Math.floor((now.getTime() - restStartedAt.getTime()) / 1000));
}
