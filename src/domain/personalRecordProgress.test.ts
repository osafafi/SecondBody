import { describe, expect, it } from 'vitest';

import type { PerformedSetRecord } from '@/types/performanceTypes';
import type { PersonalRecord } from '@/types/trainingHistoryTypes';

import {
  findBestSetForRecord,
  findPersonalRecordUpdates,
  type PersonalRecordCandidateExercise,
} from './personalRecordProgress';

function buildSet(overrides: Partial<PerformedSetRecord> = {}): PerformedSetRecord {
  return {
    setNumber: 1,
    prescribedWeightKilograms: 40,
    actualWeightKilograms: 40,
    actualReps: 10,
    effortRating: 'justRight',
    didCauseSharpPain: false,
    ...overrides,
  };
}

function buildExercise(
  exerciseId: string,
  performedSets: PerformedSetRecord[],
  wasSkipped = false,
): PersonalRecordCandidateExercise {
  return { exerciseId, performedSets, wasSkipped };
}

function buildRecord(overrides: Partial<PersonalRecord> = {}): PersonalRecord {
  return {
    exerciseId: 'legPress',
    bestWeightKilograms: 40,
    bestRepsAtBestWeight: 10,
    estimatedOneRepMaxKilograms: 53.3,
    achievedOn: '2026-03-02',
    achievedInSessionId: 'sessionOne',
    ...overrides,
  };
}

const BASE_INPUT = {
  existingRecords: [],
  exerciseIdsEligibleForRecords: ['legPress', 'chestPress'],
  achievedOn: '2026-04-09',
  achievedInSessionId: 'sessionTwo',
};

describe('findBestSetForRecord', () => {
  it('is null when nothing was logged', () => {
    expect(findBestSetForRecord([])).toBeNull();
  });

  it('picks the set with the highest estimated one-rep max, not the heaviest', () => {
    /*
     * 40 for 12 estimates 56 kg. 45 for 8 estimates 57 kg. The heavier bar is
     * not automatically the better set, which is the entire reason the estimate
     * exists.
     */
    const best = findBestSetForRecord([
      buildSet({ setNumber: 1, actualWeightKilograms: 40, actualReps: 12 }),
      buildSet({ setNumber: 2, actualWeightKilograms: 45, actualReps: 8 }),
    ]);

    expect(best?.setNumber).toBe(2);
  });

  it('ignores a set that caused sharp pain', () => {
    const best = findBestSetForRecord([
      buildSet({ setNumber: 1, actualWeightKilograms: 40, actualReps: 10 }),
      buildSet({
        setNumber: 2,
        actualWeightKilograms: 60,
        actualReps: 10,
        didCauseSharpPain: true,
      }),
    ]);

    expect(best?.setNumber).toBe(1);
  });

  it('ignores unloaded and failed sets', () => {
    expect(
      findBestSetForRecord([
        buildSet({ actualWeightKilograms: null }),
        buildSet({ actualWeightKilograms: 0 }),
        buildSet({ actualReps: 0 }),
      ]),
    ).toBeNull();
  });

  it('keeps the earlier set when two tie', () => {
    const best = findBestSetForRecord([buildSet({ setNumber: 1 }), buildSet({ setNumber: 2 })]);

    expect(best?.setNumber).toBe(1);
  });
});

describe('findPersonalRecordUpdates', () => {
  it('records the first time an exercise is ever trained', () => {
    const updates = findPersonalRecordUpdates({
      ...BASE_INPUT,
      performedExercises: [buildExercise('legPress', [buildSet()])],
    });

    expect(updates).toHaveLength(1);
    expect(updates[0]?.previousEstimatedOneRepMaxKilograms).toBeNull();
    expect(updates[0]?.record).toEqual({
      exerciseId: 'legPress',
      bestWeightKilograms: 40,
      bestRepsAtBestWeight: 10,
      estimatedOneRepMaxKilograms: 53.3,
      achievedOn: '2026-04-09',
      achievedInSessionId: 'sessionTwo',
    });
  });

  it('returns nothing for an ordinary session that beat nothing', () => {
    const updates = findPersonalRecordUpdates({
      ...BASE_INPUT,
      existingRecords: [buildRecord()],
      performedExercises: [buildExercise('legPress', [buildSet({ actualReps: 8 })])],
    });

    expect(updates).toEqual([]);
  });

  it('counts two extra reps at the same weight as a record', () => {
    const updates = findPersonalRecordUpdates({
      ...BASE_INPUT,
      existingRecords: [buildRecord()],
      performedExercises: [buildExercise('legPress', [buildSet({ actualReps: 12 })])],
    });

    expect(updates).toHaveLength(1);
    expect(updates[0]?.record.bestRepsAtBestWeight).toBe(12);
    expect(updates[0]?.previousEstimatedOneRepMaxKilograms).toBe(53.3);
  });

  it('does not treat an equal effort as a record', () => {
    const updates = findPersonalRecordUpdates({
      ...BASE_INPUT,
      existingRecords: [buildRecord()],
      performedExercises: [buildExercise('legPress', [buildSet()])],
    });

    expect(updates).toEqual([]);
  });

  it('ignores exercises that cannot hold a record', () => {
    /*
     * A farmer's carry stores metres in `actualReps` and a treadmill walk stores
     * minutes. Epley on either produces a confident, meaningless number.
     */
    const updates = findPersonalRecordUpdates({
      ...BASE_INPUT,
      performedExercises: [
        buildExercise('farmersCarry', [buildSet({ actualWeightKilograms: 20, actualReps: 30 })]),
      ],
    });

    expect(updates).toEqual([]);
  });

  it('ignores a skipped exercise', () => {
    const updates = findPersonalRecordUpdates({
      ...BASE_INPUT,
      performedExercises: [buildExercise('legPress', [buildSet()], true)],
    });

    expect(updates).toEqual([]);
  });

  it('never sets a record on a set that hurt', () => {
    const updates = findPersonalRecordUpdates({
      ...BASE_INPUT,
      existingRecords: [buildRecord()],
      performedExercises: [
        buildExercise('legPress', [
          buildSet({ actualWeightKilograms: 60, actualReps: 12, didCauseSharpPain: true }),
        ]),
      ],
    });

    expect(updates).toEqual([]);
  });

  it('handles several records in one session', () => {
    const updates = findPersonalRecordUpdates({
      ...BASE_INPUT,
      performedExercises: [
        buildExercise('legPress', [buildSet()]),
        buildExercise('chestPress', [buildSet({ actualWeightKilograms: 30, actualReps: 10 })]),
      ],
    });

    expect(updates.map((update) => update.record.exerciseId)).toEqual(['legPress', 'chestPress']);
  });
});
