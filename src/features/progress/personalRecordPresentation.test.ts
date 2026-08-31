import { describe, expect, it } from 'vitest';

import { findExerciseById } from '@/content/exercises/allExercises';
import type { PersonalRecord } from '@/types/trainingHistoryTypes';

import { resolveNamedPersonalRecords } from './personalRecordPresentation';

function buildRecord(overrides: Partial<PersonalRecord> = {}): PersonalRecord {
  return {
    exerciseId: 'legExtension',
    bestWeightKilograms: 40,
    bestRepsAtBestWeight: 10,
    estimatedOneRepMaxKilograms: 53.3,
    achievedOn: '2026-04-06',
    achievedInSessionId: 'sessionOne',
    ...overrides,
  };
}

describe('resolveNamedPersonalRecords', () => {
  it('resolves the exercise to the name the content layer gives it', () => {
    const [named] = resolveNamedPersonalRecords([buildRecord()]);

    expect(named?.exerciseDisplayName).toBe(findExerciseById('legExtension')?.displayName);
  });

  it('ranks on the estimate rather than on the weight on the bar', () => {
    /*
     * 65 for 3 is a heavier bar and a worse lift than 60 for 8. A list sorted by
     * weight would put them the wrong way round.
     */
    const ranked = resolveNamedPersonalRecords([
      buildRecord({
        exerciseId: 'legExtension',
        bestWeightKilograms: 65,
        bestRepsAtBestWeight: 3,
        estimatedOneRepMaxKilograms: 71.5,
      }),
      buildRecord({
        exerciseId: 'seatedLegCurl',
        bestWeightKilograms: 60,
        bestRepsAtBestWeight: 8,
        estimatedOneRepMaxKilograms: 76,
      }),
    ]);

    expect(ranked.map((record) => record.exerciseId)).toEqual(['seatedLegCurl', 'legExtension']);
  });

  it('drops a record for an exercise the app no longer ships', () => {
    expect(resolveNamedPersonalRecords([buildRecord({ exerciseId: 'notAnExercise' })])).toEqual([]);
  });

  it('has nothing to show for an account that has never trained', () => {
    expect(resolveNamedPersonalRecords([])).toEqual([]);
  });
});
