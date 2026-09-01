import { describe, expect, it } from 'vitest';

import { buildLoggedSet } from '@/test/trainingTestFactories';

import {
  describePerformedSet,
  describePlannedPrescription,
  describeRepRange,
  describeSessionDuration,
  describeSessionVolume,
  describeSetAgainstPrescription,
  describeSetCount,
} from './sessionDetailWording';

describe('describeRepRange', () => {
  it('writes a range with an en dash', () => {
    expect(describeRepRange(8, 12)).toBe('8–12');
  });

  it('writes a single number when both ends agree', () => {
    expect(describeRepRange(10, 10)).toBe('10');
  });
});

describe('describePlannedPrescription', () => {
  it('names the sets and the rep range, and never a weight', () => {
    const label = describePlannedPrescription(
      {
        kind: 'weightAndReps',
        repRange: { minimumReps: 8, maximumReps: 12 },
        isPerSide: false,
        startingWeightKilograms: 30,
      },
      3,
    );

    expect(label).toBe('3 × 8–12');

    /*
     * The whole point of the preview. The weight is decided when the session
     * opens, so 30 must not leak onto a screen a day early.
     */
    expect(label).not.toContain('30');
  });

  it('says when the reps are per side', () => {
    expect(
      describePlannedPrescription(
        {
          kind: 'bodyweightReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: true,
        },
        2,
      ),
    ).toBe('2 × 8–10 per side');
  });

  it('measures a carry in metres', () => {
    expect(
      describePlannedPrescription(
        { kind: 'loadedCarry', distanceMetresPerSet: 20, startingWeightKilograms: 12 },
        3,
      ),
    ).toBe('3 × 20 m');
  });

  it('gives cardio its duration and its machine settings', () => {
    expect(
      describePlannedPrescription(
        {
          kind: 'steadyStateCardio',
          durationMinutes: 10,
          machineSettingsNote: '5% incline, 5 km/h',
        },
        3,
      ),
    ).toBe('10 min · 5% incline, 5 km/h');
  });
});

describe('describePerformedSet', () => {
  it('writes the weight and the reps that were actually done', () => {
    expect(
      describePerformedSet(buildLoggedSet({ actualWeightKilograms: 40, actualReps: 12 })),
    ).toBe('40 kg × 12');
  });

  it('writes reps alone for a movement that carries no weight', () => {
    /* Not "0 kg × 12". A dead bug loaded to nothing is not loaded to zero. */
    expect(
      describePerformedSet(buildLoggedSet({ actualWeightKilograms: null, actualReps: 12 })),
    ).toBe('12 reps');
  });
});

describe('describeSetAgainstPrescription', () => {
  it('says nothing when the set went to plan', () => {
    expect(describeSetAgainstPrescription(buildLoggedSet())).toBeNull();
  });

  it('names a weight that differed from the one asked for', () => {
    expect(
      describeSetAgainstPrescription(
        buildLoggedSet({ prescribedWeightKilograms: 30, actualWeightKilograms: 35 }),
      ),
    ).toBe('asked for 30 kg');
  });

  it('names reps that fell short', () => {
    expect(
      describeSetAgainstPrescription(buildLoggedSet({ prescribedReps: 12, actualReps: 9 })),
    ).toBe('asked for 12 reps');
  });

  it('names both when both differed', () => {
    expect(
      describeSetAgainstPrescription(
        buildLoggedSet({
          prescribedWeightKilograms: 30,
          actualWeightKilograms: 35,
          prescribedReps: 12,
          actualReps: 9,
        }),
      ),
    ).toBe('asked for 30 kg, asked for 12 reps');
  });
});

describe('describeSessionDuration', () => {
  it('rounds to whole minutes', () => {
    expect(describeSessionDuration(3120)).toBe('52 min');
  });

  it('has nothing to say when no duration was recorded', () => {
    expect(describeSessionDuration(null)).toBeNull();
    expect(describeSessionDuration(0)).toBeNull();
  });
});

describe('describeSessionVolume', () => {
  it('groups thousands, because a session total gets long', () => {
    expect(describeSessionVolume(3240)).toBe('3,240 kg');
  });
});

describe('describeSetCount', () => {
  it('agrees with itself about one', () => {
    expect(describeSetCount(1)).toBe('1 set');
    expect(describeSetCount(4)).toBe('4 sets');
  });
});
