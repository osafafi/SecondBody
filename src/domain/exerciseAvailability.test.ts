import { describe, expect, it } from 'vitest';

import type { ExerciseSlot } from '@/types/programTypes';

import {
  addUnavailableExerciseId,
  removeUnavailableExerciseId,
  resolveSessionSlotAvailability,
} from './exerciseAvailability';

function buildSlot(exerciseId: string, orderIndex: number): ExerciseSlot {
  return {
    orderIndex,
    exerciseId,
    prescription: {
      kind: 'weightAndReps',
      repRange: { minimumReps: 10, maximumReps: 12 },
      isPerSide: false,
      startingWeightKilograms: 25,
    },
    restSecondsBetweenSets: 90,
    slotNote: null,
    requiresPainFreeAreas: [],
  };
}

/** The real shape of the pull family: the low row and its two equivalents. */
const SUBSTITUTES_BY_EXERCISE_ID: Record<string, string[]> = {
  seatedCableRow: ['chestSupportedDumbbellRow', 'latPulldown'],
  latPulldown: ['seatedCableRow', 'chestSupportedDumbbellRow'],
  pallofPress: [],
};

function resolveSubstituteExerciseIds(exerciseId: string): string[] {
  return SUBSTITUTES_BY_EXERCISE_ID[exerciseId] ?? [];
}

function resolve(
  slots: ExerciseSlot[],
  unavailableExerciseIds: string[],
  excludedExerciseIds: string[] = [],
) {
  return resolveSessionSlotAvailability({
    slots,
    unavailableExerciseIds,
    excludedExerciseIds,
    resolveSubstituteExerciseIds,
  });
}

describe('a session where every machine is there', () => {
  it('changes nothing and says so', () => {
    const slots = [buildSlot('seatedCableRow', 1), buildSlot('pallofPress', 2)];

    const resolved = resolve(slots, []);

    expect(resolved.map((entry) => entry.slot.exerciseId)).toEqual([
      'seatedCableRow',
      'pallofPress',
    ]);
    expect(resolved.every((entry) => entry.availabilityAdjustment === null)).toBe(true);
  });
});

describe('a machine his gym does not have', () => {
  it('swaps in the best equivalent and records what it replaced', () => {
    const resolved = resolve([buildSlot('seatedCableRow', 1)], ['seatedCableRow']);

    expect(resolved[0]?.slot.exerciseId).toBe('chestSupportedDumbbellRow');
    expect(resolved[0]?.availabilityAdjustment).toEqual({
      kind: 'substituted',
      unavailableExerciseId: 'seatedCableRow',
    });
  });

  it('keeps everything else about the slot, so the prescription still applies', () => {
    const slots = [buildSlot('seatedCableRow', 1)];

    const resolved = resolve(slots, ['seatedCableRow']);

    expect(resolved[0]?.slot.orderIndex).toBe(1);
    expect(resolved[0]?.slot.restSecondsBetweenSets).toBe(90);
    expect(resolved[0]?.slot.prescription).toEqual(slots[0]?.prescription);
  });

  it('passes over a substitute that is also unavailable', () => {
    const resolved = resolve(
      [buildSlot('seatedCableRow', 1)],
      ['seatedCableRow', 'chestSupportedDumbbellRow'],
    );

    expect(resolved[0]?.slot.exerciseId).toBe('latPulldown');
  });

  it('passes over a substitute the blacklist rules out', () => {
    const resolved = resolve(
      [buildSlot('seatedCableRow', 1)],
      ['seatedCableRow'],
      ['chestSupportedDumbbellRow'],
    );

    expect(resolved[0]?.slot.exerciseId).toBe('latPulldown');
  });

  it('never puts the same movement in a session twice', () => {
    const slots = [buildSlot('seatedCableRow', 1), buildSlot('latPulldown', 2)];

    const resolved = resolve(slots, ['seatedCableRow']);

    // The lat pulldown is already in this session, so the dumbbell row wins.
    expect(resolved[0]?.slot.exerciseId).toBe('chestSupportedDumbbellRow');
    expect(resolved[1]?.slot.exerciseId).toBe('latPulldown');
  });

  it('does not hand the same stand-in to two unavailable slots', () => {
    const slots = [buildSlot('seatedCableRow', 1), buildSlot('latPulldown', 2)];

    const resolved = resolve(slots, ['seatedCableRow', 'latPulldown']);

    expect(resolved[0]?.slot.exerciseId).toBe('chestSupportedDumbbellRow');
    // Its own two equivalents are the low row, which is out, and the dumbbell
    // row, which the slot before it has just taken.
    expect(resolved[1]?.availabilityAdjustment).toEqual({ kind: 'noSubstituteFound' });
  });
});

describe('a machine with nothing equivalent to put in its place', () => {
  it('keeps the movement rather than letting the session get shorter', () => {
    const resolved = resolve([buildSlot('pallofPress', 1)], ['pallofPress']);

    expect(resolved[0]?.slot.exerciseId).toBe('pallofPress');
    expect(resolved[0]?.availabilityAdjustment).toEqual({ kind: 'noSubstituteFound' });
  });
});

describe('keeping the list of what his gym has not got', () => {
  it('adds a movement', () => {
    expect(addUnavailableExerciseId([], 'seatedCableRow')).toEqual(['seatedCableRow']);
  });

  it('does not add the same movement twice', () => {
    const existing = ['seatedCableRow'];

    expect(addUnavailableExerciseId(existing, 'seatedCableRow')).toBe(existing);
  });

  it('keeps the list sorted, so the stored profile is stable', () => {
    expect(addUnavailableExerciseId(['seatedCableRow'], 'latPulldown')).toEqual([
      'latPulldown',
      'seatedCableRow',
    ]);
  });

  it('takes a movement off when the gym buys the machine', () => {
    expect(removeUnavailableExerciseId(['latPulldown', 'seatedCableRow'], 'latPulldown')).toEqual([
      'seatedCableRow',
    ]);
  });

  it('is untroubled by removing something that was never on the list', () => {
    expect(removeUnavailableExerciseId(['seatedCableRow'], 'deadBug')).toEqual(['seatedCableRow']);
  });
});
