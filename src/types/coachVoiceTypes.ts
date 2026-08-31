/**
 * Harout's voice, as data.
 *
 * Every line the coach says lives in `src/content/coachVoice/` so the tone can
 * be tuned in one place without touching a component. Nothing in `features/`
 * may inline coach copy — see CLAUDE.md section 7.
 */

/**
 * The moments the coach speaks at.
 *
 * A category is a moment, not a mood. What tone a moment gets is decided by the
 * lines written for it, which is what makes the whole voice adjustable by
 * editing content.
 */
export const COACH_LINE_CATEGORIES = [
  /** Opening a session, before the warm-up. */
  'sessionOpening',

  /** Handing over from the warm-up to the first working set. */
  'warmupFinished',

  /** Week 1, when there is no prescription yet and a starting line is being found. */
  'calibrationInstruction',

  /** A set came back `easy`. */
  'setFeltEasy',

  /** A set came back `justRight`. */
  'setFeltJustRight',

  /** A set came back `brutal`. */
  'setFeltBrutal',

  /** A set caused sharp or joint pain, and the load is being pulled back. */
  'sharpPainReported',

  /** The load went up. This is the moment praise is actually worth spending. */
  'loadIncreased',

  /** The load came down after a hard session. Stated as a fact, never as a failure. */
  'loadReduced',

  /** A session finished. */
  'sessionCompleted',

  /** A planned session was missed. */
  'sessionMissed',

  /** Coming back after ten days or more away. */
  'returningFromLayoff',

  /** The start of the deload week, which is going to feel like a waste of time. */
  'deloadWeekOpening',

  /** The start of a new phase. */
  'phaseOpening',

  /** Weeks 1-3, when the scale is not moving and that is the plan working. */
  'earlyScaleReassurance',

  /** The daily habits: protein, steps, liquid calories, sleep, mobility. */
  'habitEncouragement',

  /** The at-home mobility routine. */
  'mobilityRoutineOpening',
] as const;

export type CoachLineCategory = (typeof COACH_LINE_CATEGORIES)[number];

/**
 * How much of the coach the user wants. Matches `UserSettings.coachVerbosity`
 * in docs/DATA_MODEL.md.
 *
 * A line is shown when its own weight is at or below the configured verbosity:
 * `minimal` lines always appear, `detailed` lines only for someone who asked
 * for the full commentary.
 */
export const COACH_VERBOSITY_LEVELS = ['minimal', 'standard', 'detailed'] as const;
export type CoachVerbosityLevel = (typeof COACH_VERBOSITY_LEVELS)[number];

export type CoachLine = {
  /** Stable id, so a specific line can be referenced in a bug report. */
  coachLineId: string;

  category: CoachLineCategory;

  /** What Harout actually says. One or two short sentences. Contractions welcome. */
  text: string;

  /** The lowest verbosity setting at which this line is allowed to appear. */
  minimumVerbosity: CoachVerbosityLevel;

  /**
   * True when the line is praise.
   *
   * Praise is earned and rationed here — a constant stream of it stops meaning
   * anything. `src/domain/coachLineSelection.ts` will only reach for these when
   * something was genuinely achieved.
   */
  isPraise: boolean;
};
