import { describe, expect, it } from 'vitest';

import {
  BODYWEIGHT_REP_PROGRESSION_STEP,
  BRUTAL_SET_LOAD_REDUCTION_FRACTION,
  calculateNextPrescribedCarryWeight,
  calculateNextPrescribedRepRange,
  calculateNextPrescribedWeight,
  SHARP_PAIN_LOAD_REDUCTION_FRACTION,
  shouldSuggestImmediateLoadIncrease,
} from './exercisePrescription';
import { buildPerformedSet, buildSetsAtReps } from '@/test/trainingTestFactories';
import type { EffortRating, RepRange } from '@/types/trainingVocabulary';

const TEN_TO_TWELVE: RepRange = { minimumReps: 10, maximumReps: 12 };

/**
 * Sets for a loaded carry. A carry is measured in metres, so the rep count on
 * the record is not meaningful and only the effort rating matters.
 */
function buildCarrySets(setCount: number, effortRating: EffortRating) {
  return buildSetsAtReps(setCount, 1, effortRating);
}

describe('calculateNextPrescribedWeight — the double progression rule', () => {
  it('adds one increment when every set reached the top of the range', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: buildSetsAtReps(2, 12),
    });

    expect(outcome.prescribedWeightKilograms).toBe(42.5);
    expect(outcome.reason).toBe('increasedAfterFullRange');
    expect(outcome.changeFromPreviousKilograms).toBe(2.5);
  });

  it('holds when only some sets reached the top', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: [
        buildPerformedSet({ setNumber: 1, actualReps: 12 }),
        buildPerformedSet({ setNumber: 2, actualReps: 10 }),
      ],
    });

    expect(outcome.prescribedWeightKilograms).toBe(40);
    expect(outcome.reason).toBe('held');
    expect(outcome.changeFromPreviousKilograms).toBe(0);
  });

  it('counts overshooting the top of the range as reaching it', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: buildSetsAtReps(2, 14),
    });

    expect(outcome.reason).toBe('increasedAfterFullRange');
  });

  it('uses the dumbbell increment for dumbbell movements', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'dumbbellPair',
      repRange: { minimumReps: 8, maximumReps: 10 },
      lastPrescribedWeightKilograms: 8,
      lastPerformedSets: buildSetsAtReps(2, 10),
    });

    expect(outcome.prescribedWeightKilograms).toBe(10);
  });

  it('lands on a selectable weight even when the previous one was not', () => {
    // Week 1 is calibration, so he can arrive at any number he likes.
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 33,
      lastPerformedSets: buildSetsAtReps(2, 12),
    });

    expect(outcome.prescribedWeightKilograms).toBe(35);
  });
});

describe('calculateNextPrescribedWeight — auto-regulation', () => {
  it('drops ten percent when any set was brutal', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: [
        buildPerformedSet({ setNumber: 1, actualReps: 12 }),
        buildPerformedSet({ setNumber: 2, actualReps: 12, effortRating: 'brutal' }),
      ],
    });

    // 40 less ten percent is 36, rounded down to a selectable 35.
    expect(outcome.prescribedWeightKilograms).toBe(35);
    expect(outcome.reason).toBe('reducedAfterBrutalSet');
    expect(outcome.changeFromPreviousKilograms).toBe(-5);
  });

  it('a brutal set outranks every set reaching the top of the range', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: buildSetsAtReps(2, 12, 'brutal'),
    });

    expect(outcome.reason).toBe('reducedAfterBrutalSet');
  });

  it('records that every set was easy, so the coach can say the jump out loud', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: buildSetsAtReps(2, 12, 'easy'),
    });

    expect(outcome.wasEveryWorkingSetEasy).toBe(true);
    expect(outcome.reason).toBe('increasedAfterFullRange');
  });

  it('does not call it easy when the sets were easy but short of the range', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: buildSetsAtReps(2, 10, 'easy'),
    });

    expect(outcome.wasEveryWorkingSetEasy).toBe(false);
    expect(outcome.reason).toBe('held');
  });
});

describe('calculateNextPrescribedWeight — the sharp pain safety rail', () => {
  it('drops twenty percent when any set caused sharp pain', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: [
        buildPerformedSet({ setNumber: 1, actualReps: 12 }),
        buildPerformedSet({ setNumber: 2, actualReps: 8, didCauseSharpPain: true }),
      ],
    });

    // 40 less twenty percent is 32, rounded down to a selectable 30.
    expect(outcome.prescribedWeightKilograms).toBe(30);
    expect(outcome.reason).toBe('reducedAfterSharpPain');
    expect(outcome.shouldFlagExerciseForPain).toBe(true);
  });

  it('outranks a brutal set, so the larger reduction is the one that applies', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: [
        buildPerformedSet({ setNumber: 1, effortRating: 'brutal' }),
        buildPerformedSet({ setNumber: 2, didCauseSharpPain: true }),
      ],
    });

    expect(outcome.reason).toBe('reducedAfterSharpPain');
    expect(outcome.prescribedWeightKilograms).toBe(30);
  });

  it('outranks a perfect session, because pain is not an effort signal', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: buildSetsAtReps(2, 12, 'easy').map((performedSet, index) =>
        index === 0 ? { ...performedSet, didCauseSharpPain: true } : performedSet,
      ),
    });

    expect(outcome.reason).toBe('reducedAfterSharpPain');
  });

  it('reduces by more than a brutal set does', () => {
    expect(SHARP_PAIN_LOAD_REDUCTION_FRACTION).toBeGreaterThan(BRUTAL_SET_LOAD_REDUCTION_FRACTION);
  });
});

describe('calculateNextPrescribedWeight — nothing was performed', () => {
  it('holds the weight rather than guessing when there are no sets', () => {
    const outcome = calculateNextPrescribedWeight({
      loadingStyle: 'weightStackMachine',
      repRange: TEN_TO_TWELVE,
      lastPrescribedWeightKilograms: 40,
      lastPerformedSets: [],
    });

    expect(outcome.prescribedWeightKilograms).toBe(40);
    expect(outcome.reason).toBe('held');
    expect(outcome.wasEveryWorkingSetEasy).toBe(false);
  });
});

describe('shouldSuggestImmediateLoadIncrease', () => {
  it('suggests going up when every set so far was easy at the top of the range', () => {
    expect(shouldSuggestImmediateLoadIncrease(buildSetsAtReps(2, 12, 'easy'), TEN_TO_TWELVE)).toBe(
      true,
    );
  });

  it('says nothing when a set merely felt right', () => {
    expect(
      shouldSuggestImmediateLoadIncrease(buildSetsAtReps(2, 12, 'justRight'), TEN_TO_TWELVE),
    ).toBe(false);
  });

  it('says nothing when the reps fell short, however easy it felt', () => {
    expect(shouldSuggestImmediateLoadIncrease(buildSetsAtReps(2, 11, 'easy'), TEN_TO_TWELVE)).toBe(
      false,
    );
  });

  it('says nothing when a set caused sharp pain, easy or not', () => {
    const setsWithPain = [
      buildPerformedSet({ setNumber: 1, actualReps: 12, effortRating: 'easy' }),
      buildPerformedSet({
        setNumber: 2,
        actualReps: 12,
        effortRating: 'easy',
        didCauseSharpPain: true,
      }),
    ];

    expect(shouldSuggestImmediateLoadIncrease(setsWithPain, TEN_TO_TWELVE)).toBe(false);
  });

  it('says nothing before any set has been done', () => {
    expect(shouldSuggestImmediateLoadIncrease([], TEN_TO_TWELVE)).toBe(false);
  });
});

describe('calculateNextPrescribedCarryWeight', () => {
  it('goes up only when the whole carry felt easy', () => {
    const outcome = calculateNextPrescribedCarryWeight({
      loadingStyle: 'dumbbellPair',
      lastPrescribedWeightKilograms: 12,
      lastPerformedSets: buildCarrySets(2, 'easy'),
    });

    expect(outcome.prescribedWeightKilograms).toBe(14);
    expect(outcome.reason).toBe('increasedAfterFullRange');
  });

  it('holds when it merely felt right, because a hard carry is already working', () => {
    const outcome = calculateNextPrescribedCarryWeight({
      loadingStyle: 'dumbbellPair',
      lastPrescribedWeightKilograms: 12,
      lastPerformedSets: buildCarrySets(2, 'justRight'),
    });

    expect(outcome.prescribedWeightKilograms).toBe(12);
    expect(outcome.reason).toBe('held');
  });

  it('applies the same two safety reductions as everything else', () => {
    const afterBrutal = calculateNextPrescribedCarryWeight({
      loadingStyle: 'dumbbellPair',
      lastPrescribedWeightKilograms: 20,
      lastPerformedSets: buildCarrySets(2, 'brutal'),
    });
    const afterPain = calculateNextPrescribedCarryWeight({
      loadingStyle: 'dumbbellPair',
      lastPrescribedWeightKilograms: 20,
      lastPerformedSets: [
        buildPerformedSet({ setNumber: 1 }),
        buildPerformedSet({ setNumber: 2, didCauseSharpPain: true }),
      ],
    });

    expect(afterBrutal.prescribedWeightKilograms).toBe(18);
    expect(afterBrutal.reason).toBe('reducedAfterBrutalSet');
    expect(afterPain.prescribedWeightKilograms).toBe(16);
    expect(afterPain.reason).toBe('reducedAfterSharpPain');
  });
});

describe('calculateNextPrescribedRepRange — bodyweight progression', () => {
  const BASE_RANGE: RepRange = { minimumReps: 6, maximumReps: 8 };

  it('adds two reps to both ends when every set reached the top', () => {
    const outcome = calculateNextPrescribedRepRange({
      baseRepRange: BASE_RANGE,
      lastPrescribedRepRange: BASE_RANGE,
      lastPerformedSets: buildSetsAtReps(2, 8),
    });

    expect(outcome.repRange).toEqual({ minimumReps: 8, maximumReps: 10 });
    expect(outcome.reason).toBe('increasedAfterFullRange');
    expect(BODYWEIGHT_REP_PROGRESSION_STEP).toBe(2);
  });

  it('holds when the sets fell short', () => {
    const outcome = calculateNextPrescribedRepRange({
      baseRepRange: BASE_RANGE,
      lastPrescribedRepRange: BASE_RANGE,
      lastPerformedSets: buildSetsAtReps(2, 7),
    });

    expect(outcome.repRange).toEqual(BASE_RANGE);
    expect(outcome.reason).toBe('held');
  });

  it('takes two reps back off after a brutal set', () => {
    const outcome = calculateNextPrescribedRepRange({
      baseRepRange: BASE_RANGE,
      lastPrescribedRepRange: { minimumReps: 10, maximumReps: 12 },
      lastPerformedSets: buildSetsAtReps(2, 12, 'brutal'),
    });

    expect(outcome.repRange).toEqual({ minimumReps: 8, maximumReps: 10 });
    expect(outcome.reason).toBe('reducedAfterBrutalSet');
  });

  it('never falls below the range the programme actually asks for', () => {
    const outcome = calculateNextPrescribedRepRange({
      baseRepRange: BASE_RANGE,
      lastPrescribedRepRange: BASE_RANGE,
      lastPerformedSets: buildSetsAtReps(2, 8, 'brutal'),
    });

    expect(outcome.repRange).toEqual(BASE_RANGE);
  });

  it('flags the exercise and reduces after sharp pain', () => {
    const outcome = calculateNextPrescribedRepRange({
      baseRepRange: BASE_RANGE,
      lastPrescribedRepRange: { minimumReps: 10, maximumReps: 12 },
      lastPerformedSets: [
        buildPerformedSet({ setNumber: 1, actualReps: 12 }),
        buildPerformedSet({ setNumber: 2, actualReps: 6, didCauseSharpPain: true }),
      ],
    });

    expect(outcome.repRange).toEqual({ minimumReps: 8, maximumReps: 10 });
    expect(outcome.reason).toBe('reducedAfterSharpPain');
    expect(outcome.shouldFlagExerciseForPain).toBe(true);
  });

  it('holds when nothing was performed', () => {
    const outcome = calculateNextPrescribedRepRange({
      baseRepRange: BASE_RANGE,
      lastPrescribedRepRange: BASE_RANGE,
      lastPerformedSets: [],
    });

    expect(outcome.repRange).toEqual(BASE_RANGE);
    expect(outcome.reason).toBe('held');
  });
});
