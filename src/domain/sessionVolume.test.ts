import { describe, expect, it } from 'vitest';

import { calculateExerciseVolumeKilograms, calculateSessionVolumeKilograms } from './sessionVolume';
import { buildPerformedSet } from '@/test/trainingTestFactories';

describe('calculateExerciseVolumeKilograms', () => {
  it('multiplies weight by reps across every set', () => {
    const volume = calculateExerciseVolumeKilograms({
      loadingStyle: 'weightStackMachine',
      isPerSide: false,
      performedSets: [
        buildPerformedSet({ setNumber: 1, actualWeightKilograms: 40, actualReps: 12 }),
        buildPerformedSet({ setNumber: 2, actualWeightKilograms: 40, actualReps: 10 }),
      ],
    });

    expect(volume).toBe(880);
  });

  it('counts both dumbbells of a pair', () => {
    const volume = calculateExerciseVolumeKilograms({
      loadingStyle: 'dumbbellPair',
      isPerSide: false,
      performedSets: [buildPerformedSet({ actualWeightKilograms: 8, actualReps: 10 })],
    });

    // Eight kilos in each hand, ten times: 160, not 80.
    expect(volume).toBe(160);
  });

  it('counts a single dumbbell once', () => {
    const volume = calculateExerciseVolumeKilograms({
      loadingStyle: 'singleDumbbell',
      isPerSide: false,
      performedSets: [buildPerformedSet({ actualWeightKilograms: 10, actualReps: 10 })],
    });

    expect(volume).toBe(100);
  });

  it('doubles the reps of a per-side movement, because both sides were trained', () => {
    const volume = calculateExerciseVolumeKilograms({
      loadingStyle: 'cableStack',
      isPerSide: true,
      performedSets: [buildPerformedSet({ actualWeightKilograms: 10, actualReps: 10 })],
    });

    expect(volume).toBe(200);
  });

  it('contributes nothing for a bodyweight movement', () => {
    const volume = calculateExerciseVolumeKilograms({
      loadingStyle: 'bodyweight',
      isPerSide: true,
      performedSets: [buildPerformedSet({ actualWeightKilograms: null, actualReps: 8 })],
    });

    expect(volume).toBe(0);
  });

  it('contributes nothing for an exercise with no sets', () => {
    expect(
      calculateExerciseVolumeKilograms({
        loadingStyle: 'weightStackMachine',
        isPerSide: false,
        performedSets: [],
      }),
    ).toBe(0);
  });
});

describe('calculateSessionVolumeKilograms', () => {
  it('sums every exercise in the session', () => {
    const volume = calculateSessionVolumeKilograms([
      {
        loadingStyle: 'weightStackMachine',
        isPerSide: false,
        performedSets: [buildPerformedSet({ actualWeightKilograms: 40, actualReps: 12 })],
      },
      {
        loadingStyle: 'dumbbellPair',
        isPerSide: false,
        performedSets: [buildPerformedSet({ actualWeightKilograms: 8, actualReps: 10 })],
      },
      {
        loadingStyle: 'unloaded',
        isPerSide: false,
        performedSets: [buildPerformedSet({ actualWeightKilograms: null, actualReps: 0 })],
      },
    ]);

    expect(volume).toBe(640);
  });

  it('is zero for a session with nothing in it', () => {
    expect(calculateSessionVolumeKilograms([])).toBe(0);
  });
});
