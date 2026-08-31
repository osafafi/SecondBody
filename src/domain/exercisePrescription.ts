import type { PerformedSetRecord } from '@/types/performanceTypes';
import type { LoadingStyle, RepRange } from '@/types/trainingVocabulary';

import {
  resolveSmallestLoadIncrementKilograms,
  roundWeightDownToLoadableValue,
  roundWeightToNearestLoadableValue,
} from './loadIncrements';

/**
 * Double progression, and the auto-regulation that sits on top of it.
 *
 * The rule, from docs/TRAINING_PROGRAM.md section 7:
 *
 * > When every set in a session hits the top of the rep range, and none of them
 * > were rated "brutal", add the smallest available increment next time.
 *
 * Plus two overrides that outrank it, in this order:
 *
 * 1. Any set that caused **sharp or joint pain** drops the load 20% and flags
 *    the exercise. This is a safety rail, not an effort signal, so it wins over
 *    everything — including over a session where every other set was perfect.
 * 2. Any set rated **brutal** drops the load 10%.
 *
 * This is the file that decides what weight goes on the machine, so it is the
 * part that must not be wrong. Every branch below has a test.
 */

/** A set that caused sharp pain takes this fraction off the load next time. */
export const SHARP_PAIN_LOAD_REDUCTION_FRACTION = 0.2;

/** A set rated "brutal" takes this fraction off the load next time. */
export const BRUTAL_SET_LOAD_REDUCTION_FRACTION = 0.1;

/** Bodyweight movements progress by this many reps before load is considered. */
export const BODYWEIGHT_REP_PROGRESSION_STEP = 2;

/**
 * Why the prescribed load is what it is.
 *
 * Returned instead of a sentence so that the coach's wording lives in
 * `src/content/coachVoice/` where it can be tuned, and the decision lives here
 * where it can be tested.
 */
export type LoadDecisionReason =
  /** No history for this exercise yet. Week 1, or the first time a movement appears. */
  | 'firstTimeCalibration'
  /** Every set reached the top of the range and nothing was brutal. Load goes up. */
  | 'increasedAfterFullRange'
  /** Somewhere in between. Same weight again. */
  | 'held'
  /** At least one set was brutal. Down 10%. */
  | 'reducedAfterBrutalSet'
  /** At least one set caused sharp or joint pain. Down 20%, and the exercise is flagged. */
  | 'reducedAfterSharpPain';

export type LoadPrescriptionOutcome = {
  prescribedWeightKilograms: number;
  reason: LoadDecisionReason;

  /** Signed. Positive when the load went up, negative when it came down. */
  changeFromPreviousKilograms: number;

  /**
   * True when every set was rated `easy` at the top of the range.
   *
   * The load goes up either way; this is what lets the app say "that was too
   * light and we both know it" rather than quietly nudging the number.
   */
  wasEveryWorkingSetEasy: boolean;

  /**
   * True when a set caused sharp pain. The exercise is flagged for attention
   * regardless of what happens to the weight.
   */
  shouldFlagExerciseForPain: boolean;
};

export type NextPrescribedWeightInput = {
  loadingStyle: LoadingStyle;
  repRange: RepRange;
  lastPrescribedWeightKilograms: number;

  /** Working sets only, in the order they were performed. Ramp sets are not included. */
  lastPerformedSets: PerformedSetRecord[];
};

function didEverySetReachTopOfRange(
  performedSets: PerformedSetRecord[],
  repRange: RepRange,
): boolean {
  return performedSets.every((performedSet) => performedSet.actualReps >= repRange.maximumReps);
}

/**
 * The next load for a weighted exercise, given how the last one went.
 *
 * `lastPrescribedWeightKilograms` is what the app asked for last time rather
 * than the heaviest set actually performed, so that going off-script for one set
 * does not silently become the new baseline.
 */
export function calculateNextPrescribedWeight(
  input: NextPrescribedWeightInput,
): LoadPrescriptionOutcome {
  const { loadingStyle, repRange, lastPrescribedWeightKilograms, lastPerformedSets } = input;

  const didAnySetCauseSharpPain = lastPerformedSets.some(
    (performedSet) => performedSet.didCauseSharpPain,
  );
  const wasAnySetBrutal = lastPerformedSets.some(
    (performedSet) => performedSet.effortRating === 'brutal',
  );
  const wasEveryWorkingSetEasy =
    lastPerformedSets.length > 0 &&
    lastPerformedSets.every((performedSet) => performedSet.effortRating === 'easy') &&
    didEverySetReachTopOfRange(lastPerformedSets, repRange);

  const buildOutcome = (
    prescribedWeightKilograms: number,
    reason: LoadDecisionReason,
  ): LoadPrescriptionOutcome => ({
    prescribedWeightKilograms,
    reason,
    changeFromPreviousKilograms:
      Math.round((prescribedWeightKilograms - lastPrescribedWeightKilograms) * 100) / 100,
    wasEveryWorkingSetEasy,
    shouldFlagExerciseForPain: didAnySetCauseSharpPain,
  });

  // Nothing was performed — a skipped exercise, or a session abandoned before
  // this one came up. Hold rather than guess.
  if (lastPerformedSets.length === 0) {
    return buildOutcome(lastPrescribedWeightKilograms, 'held');
  }

  if (didAnySetCauseSharpPain) {
    return buildOutcome(
      roundWeightDownToLoadableValue(
        lastPrescribedWeightKilograms * (1 - SHARP_PAIN_LOAD_REDUCTION_FRACTION),
        loadingStyle,
      ),
      'reducedAfterSharpPain',
    );
  }

  if (wasAnySetBrutal) {
    return buildOutcome(
      roundWeightDownToLoadableValue(
        lastPrescribedWeightKilograms * (1 - BRUTAL_SET_LOAD_REDUCTION_FRACTION),
        loadingStyle,
      ),
      'reducedAfterBrutalSet',
    );
  }

  if (didEverySetReachTopOfRange(lastPerformedSets, repRange)) {
    const loadableStartingPoint = roundWeightToNearestLoadableValue(
      lastPrescribedWeightKilograms,
      loadingStyle,
    );

    return buildOutcome(
      roundWeightToNearestLoadableValue(
        loadableStartingPoint + resolveSmallestLoadIncrementKilograms(loadingStyle),
        loadingStyle,
      ),
      'increasedAfterFullRange',
    );
  }

  return buildOutcome(lastPrescribedWeightKilograms, 'held');
}

/**
 * Whether to suggest going up *right now*, mid-session, rather than waiting for
 * next time.
 *
 * docs/TRAINING_PROGRAM.md section 7 asks for the jump to be suggested
 * explicitly when everything so far has been easy at the top of the range,
 * rather than sitting on the information for two days.
 */
export function shouldSuggestImmediateLoadIncrease(
  completedSets: PerformedSetRecord[],
  repRange: RepRange,
): boolean {
  if (completedSets.length === 0) {
    return false;
  }

  return completedSets.every(
    (completedSet) =>
      completedSet.effortRating === 'easy' &&
      !completedSet.didCauseSharpPain &&
      completedSet.actualReps >= repRange.maximumReps,
  );
}

export type NextPrescribedCarryWeightInput = {
  loadingStyle: LoadingStyle;
  lastPrescribedWeightKilograms: number;
  lastPerformedSets: PerformedSetRecord[];
};

/**
 * The next load for a loaded carry.
 *
 * A carry has a distance rather than a rep range, so there is no "top of the
 * range" to reach and the ordinary double progression rule has nothing to fire
 * on. The equivalent trigger is that the whole distance was covered and it felt
 * easy: a carry that felt merely `justRight` stays where it is, because a carry
 * that is a genuine effort is already doing its job on grip and posture.
 *
 * The two safety reductions are identical to every other movement.
 */
export function calculateNextPrescribedCarryWeight(
  input: NextPrescribedCarryWeightInput,
): LoadPrescriptionOutcome {
  const { loadingStyle, lastPrescribedWeightKilograms, lastPerformedSets } = input;

  const didAnySetCauseSharpPain = lastPerformedSets.some(
    (performedSet) => performedSet.didCauseSharpPain,
  );
  const wasAnySetBrutal = lastPerformedSets.some(
    (performedSet) => performedSet.effortRating === 'brutal',
  );
  const wasEveryWorkingSetEasy =
    lastPerformedSets.length > 0 &&
    lastPerformedSets.every((performedSet) => performedSet.effortRating === 'easy');

  const buildOutcome = (
    prescribedWeightKilograms: number,
    reason: LoadDecisionReason,
  ): LoadPrescriptionOutcome => ({
    prescribedWeightKilograms,
    reason,
    changeFromPreviousKilograms:
      Math.round((prescribedWeightKilograms - lastPrescribedWeightKilograms) * 100) / 100,
    wasEveryWorkingSetEasy,
    shouldFlagExerciseForPain: didAnySetCauseSharpPain,
  });

  if (lastPerformedSets.length === 0) {
    return buildOutcome(lastPrescribedWeightKilograms, 'held');
  }

  if (didAnySetCauseSharpPain) {
    return buildOutcome(
      roundWeightDownToLoadableValue(
        lastPrescribedWeightKilograms * (1 - SHARP_PAIN_LOAD_REDUCTION_FRACTION),
        loadingStyle,
      ),
      'reducedAfterSharpPain',
    );
  }

  if (wasAnySetBrutal) {
    return buildOutcome(
      roundWeightDownToLoadableValue(
        lastPrescribedWeightKilograms * (1 - BRUTAL_SET_LOAD_REDUCTION_FRACTION),
        loadingStyle,
      ),
      'reducedAfterBrutalSet',
    );
  }

  if (wasEveryWorkingSetEasy) {
    const loadableStartingPoint = roundWeightToNearestLoadableValue(
      lastPrescribedWeightKilograms,
      loadingStyle,
    );

    return buildOutcome(
      roundWeightToNearestLoadableValue(
        loadableStartingPoint + resolveSmallestLoadIncrementKilograms(loadingStyle),
        loadingStyle,
      ),
      'increasedAfterFullRange',
    );
  }

  return buildOutcome(lastPrescribedWeightKilograms, 'held');
}

/** Why a bodyweight movement's rep range is what it is. */
export type RepRangeDecisionReason =
  | 'firstTimeCalibration'
  | 'increasedAfterFullRange'
  | 'held'
  | 'reducedAfterBrutalSet'
  | 'reducedAfterSharpPain';

export type RepRangePrescriptionOutcome = {
  repRange: RepRange;
  reason: RepRangeDecisionReason;
  shouldFlagExerciseForPain: boolean;
};

export type NextPrescribedRepRangeInput = {
  /**
   * The range written in the programme template. Reductions never go below it —
   * a bad week should not permanently shrink what the session asks for.
   */
  baseRepRange: RepRange;

  lastPrescribedRepRange: RepRange;
  lastPerformedSets: PerformedSetRecord[];
};

function shiftRepRange(repRange: RepRange, byReps: number): RepRange {
  return {
    minimumReps: repRange.minimumReps + byReps,
    maximumReps: repRange.maximumReps + byReps,
  };
}

/**
 * The same double progression, for movements with no weight to add.
 *
 * "Bodyweight: +2 reps, then add load" — so the range itself climbs, and the
 * programme swaps in a loaded variant when it is time. That swap is a content
 * decision (see the Phase 3 templates), not something this function does.
 */
export function calculateNextPrescribedRepRange(
  input: NextPrescribedRepRangeInput,
): RepRangePrescriptionOutcome {
  const { baseRepRange, lastPrescribedRepRange, lastPerformedSets } = input;

  const didAnySetCauseSharpPain = lastPerformedSets.some(
    (performedSet) => performedSet.didCauseSharpPain,
  );
  const wasAnySetBrutal = lastPerformedSets.some(
    (performedSet) => performedSet.effortRating === 'brutal',
  );

  const reduceButNotBelowBase = (): RepRange => {
    const reducedRange = shiftRepRange(lastPrescribedRepRange, -BODYWEIGHT_REP_PROGRESSION_STEP);

    return reducedRange.maximumReps < baseRepRange.maximumReps ? baseRepRange : reducedRange;
  };

  if (lastPerformedSets.length === 0) {
    return {
      repRange: lastPrescribedRepRange,
      reason: 'held',
      shouldFlagExerciseForPain: false,
    };
  }

  if (didAnySetCauseSharpPain) {
    return {
      repRange: reduceButNotBelowBase(),
      reason: 'reducedAfterSharpPain',
      shouldFlagExerciseForPain: true,
    };
  }

  if (wasAnySetBrutal) {
    return {
      repRange: reduceButNotBelowBase(),
      reason: 'reducedAfterBrutalSet',
      shouldFlagExerciseForPain: false,
    };
  }

  if (didEverySetReachTopOfRange(lastPerformedSets, lastPrescribedRepRange)) {
    return {
      repRange: shiftRepRange(lastPrescribedRepRange, BODYWEIGHT_REP_PROGRESSION_STEP),
      reason: 'increasedAfterFullRange',
      shouldFlagExerciseForPain: false,
    };
  }

  return {
    repRange: lastPrescribedRepRange,
    reason: 'held',
    shouldFlagExerciseForPain: false,
  };
}
