import type { CoachLine, CoachVerbosityLevel } from '@/types/coachVoiceTypes';

import type { LoadDecisionReason } from './exercisePrescription';

/**
 * Choosing which of Harout's lines to say, and — more importantly — when to say
 * nothing at all.
 *
 * Two rules come from CLAUDE.md section 7, and both are here rather than in a
 * component so they can be tested:
 *
 * 1. **Praise is earned and rationed.** Omar responds well to genuine feedback
 *    and badly to a constant stream of it. A praise line is only ever offered
 *    when something actually happened — a load went up — or on the occasional
 *    session milestone.
 * 2. **Selection is deterministic.** `src/domain/` has no randomness, so the
 *    caller passes a rotation index (the session number, the set number, a
 *    counter) and the same input always produces the same line. That also means
 *    the same line never repeats twice in a row by accident.
 */

/** Sessions between one "that was a proper session" and the next. */
export const SESSIONS_BETWEEN_COMPLETION_PRAISE = 6;

const VERBOSITY_RANK: Record<CoachVerbosityLevel, number> = {
  minimal: 0,
  standard: 1,
  detailed: 2,
};

/** True when a line is quiet enough for the configured verbosity. */
export function isLineAllowedAtVerbosity(
  line: CoachLine,
  configuredVerbosity: CoachVerbosityLevel,
): boolean {
  return VERBOSITY_RANK[line.minimumVerbosity] <= VERBOSITY_RANK[configuredVerbosity];
}

export type CoachLineSelectionInput = {
  /** Every line written for the moment in question, from `src/content/coachVoice/`. */
  candidateLines: CoachLine[];

  configuredVerbosity: CoachVerbosityLevel;

  /**
   * Anything that counts up: sessions completed, sets logged, days elapsed.
   * Used modulo the number of eligible lines, so the voice rotates instead of
   * repeating.
   */
  rotationIndex: number;

  /**
   * Whether praise is available to spend right now. False means praise lines are
   * filtered out entirely, not that they are merely deprioritised.
   */
  mayUsePraise: boolean;
};

/**
 * One line, or null when nothing is worth saying.
 *
 * Null is a real answer and callers should render nothing rather than falling
 * back to something generic. Silence is part of the voice.
 */
export function selectCoachLine(input: CoachLineSelectionInput): CoachLine | null {
  const { candidateLines, configuredVerbosity, rotationIndex, mayUsePraise } = input;

  const eligibleLines = candidateLines.filter(
    (line) =>
      isLineAllowedAtVerbosity(line, configuredVerbosity) && (mayUsePraise || !line.isPraise),
  );

  if (eligibleLines.length === 0) {
    return null;
  }

  // Guards against a negative rotation index producing a negative remainder.
  const safeRotationIndex = Math.abs(Math.trunc(rotationIndex));

  return eligibleLines[safeRotationIndex % eligibleLines.length] ?? null;
}

/**
 * Whether a load decision is worth praising.
 *
 * Only one of them is. Holding a weight is not an achievement, backing off is
 * not a failure, and a first-time calibration has not proved anything yet — so
 * praise is reserved for the load actually going up, which is a real thing that
 * happened and which he made happen.
 */
export function canSpendPraiseOnLoadDecision(reason: LoadDecisionReason): boolean {
  return reason === 'increasedAfterFullRange';
}

/**
 * Whether finishing this session earns a word.
 *
 * Turning up is the expected outcome rather than an achievement, so most
 * sessions close with a plain acknowledgement. Every sixth one — roughly once a
 * fortnight on three sessions a week — gets something warmer.
 */
export function shouldPraiseSessionCompletion(completedSessionCount: number): boolean {
  if (completedSessionCount <= 0) {
    return false;
  }

  return completedSessionCount % SESSIONS_BETWEEN_COMPLETION_PRAISE === 0;
}
