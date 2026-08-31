import { findCoachLinesByCategory } from '@/content/coachVoice/allCoachLines';
import {
  canSpendPraiseOnLoadDecision,
  selectCoachLine,
  shouldPraiseSessionCompletion,
} from '@/domain/coachLineSelection';
import type { LoadDecisionReason } from '@/domain/exercisePrescription';
import type { CoachLineCategory, CoachVerbosityLevel } from '@/types/coachVoiceTypes';
import type { EffortRating } from '@/types/trainingVocabulary';

/**
 * Which of Harout's lines belongs to each moment of a session.
 *
 * The lines themselves live in `src/content/coachVoice/` and the rules about
 * rationing praise live in `src/domain/coachLineSelection.ts`. This is the thin
 * layer between them: it knows that a set rated `brutal` is a `setFeltBrutal`
 * moment, and nothing else.
 *
 * Every function returns a string or null, and **null means say nothing**.
 * Silence is part of the voice — a component that substitutes something generic
 * when there is no line has broken it.
 */

export type CoachContext = {
  configuredVerbosity: CoachVerbosityLevel;

  /**
   * Anything that counts up. Passed to `selectCoachLine` so the voice rotates
   * without `src/domain/` ever reaching for randomness.
   */
  rotationIndex: number;
};

function selectLineText(
  category: CoachLineCategory,
  context: CoachContext,
  mayUsePraise: boolean,
): string | null {
  return (
    selectCoachLine({
      candidateLines: findCoachLinesByCategory(category),
      configuredVerbosity: context.configuredVerbosity,
      rotationIndex: context.rotationIndex,
      mayUsePraise,
    })?.text ?? null
  );
}

/** What he says when the session opens, before the warm-up. */
export function selectSessionOpeningLine(context: CoachContext): string | null {
  return selectLineText('sessionOpening', context, false);
}

/** The hand-over from the warm-up drills to the first working set. */
export function selectWarmupFinishedLine(context: CoachContext): string | null {
  return selectLineText('warmupFinished', context, false);
}

/** Week 1 only: there is no prescription yet, so he explains what to do instead. */
export function selectCalibrationInstructionLine(context: CoachContext): string | null {
  return selectLineText('calibrationInstruction', context, false);
}

const CATEGORY_BY_EFFORT_RATING: Record<EffortRating, CoachLineCategory> = {
  easy: 'setFeltEasy',
  justRight: 'setFeltJustRight',
  brutal: 'setFeltBrutal',
};

/**
 * What he says about the set that has just been logged.
 *
 * Sharp pain outranks the effort rating, because both can be true of one set and
 * the pain is the one that changes what happens next.
 */
export function selectSetFeedbackLine(
  effortRating: EffortRating,
  didCauseSharpPain: boolean,
  context: CoachContext,
): string | null {
  return selectLineText(
    didCauseSharpPain ? 'sharpPainReported' : CATEGORY_BY_EFFORT_RATING[effortRating],
    context,
    false,
  );
}

/**
 * What he says about the weight having changed since last time.
 *
 * Null when it has not changed, which is most sessions and most exercises. The
 * load holding steady is not news, and saying so every time is how a coach stops
 * being listened to.
 */
export function selectLoadChangeLine(
  loadDecisionReason: LoadDecisionReason,
  context: CoachContext,
): string | null {
  if (loadDecisionReason === 'increasedAfterFullRange') {
    // The one moment praise is genuinely worth spending. See the domain rule.
    return selectLineText(
      'loadIncreased',
      context,
      canSpendPraiseOnLoadDecision(loadDecisionReason),
    );
  }

  if (
    loadDecisionReason === 'reducedAfterBrutalSet' ||
    loadDecisionReason === 'reducedAfterSharpPain'
  ) {
    return selectLineText('loadReduced', context, false);
  }

  return null;
}

/**
 * What he says at the end.
 *
 * `completedSessionCount` includes the session that has just finished, because
 * the rule is about how many have been done rather than how many had been.
 */
export function selectSessionCompletedLine(
  completedSessionCount: number,
  context: CoachContext,
): string | null {
  return selectLineText(
    'sessionCompleted',
    context,
    shouldPraiseSessionCompletion(completedSessionCount),
  );
}

/** The deload week is going to feel like a waste of time, so he says so first. */
export function selectDeloadWeekLine(context: CoachContext): string | null {
  return selectLineText('deloadWeekOpening', context, false);
}

/** Coming back after ten days or more away. */
export function selectReturningFromLayoffLine(context: CoachContext): string | null {
  return selectLineText('returningFromLayoff', context, false);
}
