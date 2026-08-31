import { describe, expect, it } from 'vitest';

import {
  fromBodyMetricDocument,
  fromDailyHabitDocument,
  toBodyMetricDocumentFields,
  toDailyHabitDocumentFields,
} from './dailyTrackingDocumentMapping';

function buildFakeTimestamp(isoString: string) {
  return { toDate: () => new Date(isoString) };
}

describe('reading a body metric entry', () => {
  it('reads a full entry back', () => {
    const entry = fromBodyMetricDocument('metric-1', {
      recordedOn: '2026-09-14',
      weightKilograms: 88.4,
      waistCentimetres: 96,
      chestCentimetres: 104,
      hipsCentimetres: 100,
      notes: 'after a heavy weekend',
      createdAt: buildFakeTimestamp('2026-09-14T07:00:00.000Z'),
    });

    expect(entry.recordedOn).toBe('2026-09-14');
    expect(entry.weightKilograms).toBe(88.4);
    expect(entry.waistCentimetres).toBe(96);
    expect(entry.notes).toBe('after a heavy weekend');
    expect(entry.createdAt).toBeInstanceOf(Date);
  });

  /*
   * The whole point of this file. An unmeasured waist and a 0 cm waist are
   * different facts, and the charts average these numbers — a defaulted zero
   * would drag a trend line down while looking exactly like data.
   */
  it('keeps an unmeasured field null rather than defaulting it to zero', () => {
    const entry = fromBodyMetricDocument('metric-1', {
      recordedOn: '2026-09-14',
      weightKilograms: 88.4,
      createdAt: buildFakeTimestamp('2026-09-14T07:00:00.000Z'),
    });

    expect(entry.waistCentimetres).toBeNull();
    expect(entry.chestCentimetres).toBeNull();
    expect(entry.hipsCentimetres).toBeNull();
    expect(entry.notes).toBeNull();
  });

  it('reads an entry with measurements but no weight', () => {
    const entry = fromBodyMetricDocument('metric-1', {
      recordedOn: '2026-09-14',
      weightKilograms: null,
      waistCentimetres: 96,
      createdAt: buildFakeTimestamp('2026-09-14T07:00:00.000Z'),
    });

    expect(entry.weightKilograms).toBeNull();
    expect(entry.waistCentimetres).toBe(96);
  });

  it('refuses a recorded date that is not a real calendar day', () => {
    expect(() =>
      fromBodyMetricDocument('metric-1', {
        recordedOn: '14/09/2026',
        createdAt: buildFakeTimestamp('2026-09-14T07:00:00.000Z'),
      }),
    ).toThrow(/recordedOn/);
  });

  it('survives a round trip unchanged', () => {
    const original = fromBodyMetricDocument('metric-1', {
      recordedOn: '2026-09-14',
      weightKilograms: 88.4,
      waistCentimetres: null,
      chestCentimetres: null,
      hipsCentimetres: null,
      notes: null,
      createdAt: buildFakeTimestamp('2026-09-14T07:00:00.000Z'),
    });

    const readBack = fromBodyMetricDocument('metric-1', {
      ...toBodyMetricDocumentFields(original),
      createdAt: buildFakeTimestamp(original.createdAt.toISOString()),
    });

    expect(readBack).toEqual(original);
  });
});

describe('reading a daily habit record', () => {
  it('reads a fully answered day', () => {
    const record = fromDailyHabitDocument('2026-09-14', {
      onDate: '2026-09-14',
      didHitProteinTarget: true,
      didAvoidLiquidCalories: true,
      didCompleteMobilityRoutine: false,
      stepCount: 8400,
      sleepHours: 7.5,
      updatedAt: buildFakeTimestamp('2026-09-14T21:00:00.000Z'),
    });

    expect(record.didHitProteinTarget).toBe(true);
    expect(record.didCompleteMobilityRoutine).toBe(false);
    expect(record.stepCount).toBe(8400);
    expect(record.sleepHours).toBe(7.5);
  });

  it('takes the date from the document id, which is the source of truth', () => {
    const record = fromDailyHabitDocument('2026-09-14', {
      onDate: '2020-01-01',
      updatedAt: buildFakeTimestamp('2026-09-14T21:00:00.000Z'),
    });

    expect(record.onDate).toBe('2026-09-14');
  });

  it('treats an absent tick as not ticked, so a new habit row does not break old days', () => {
    const record = fromDailyHabitDocument('2026-09-14', {
      didHitProteinTarget: true,
      updatedAt: buildFakeTimestamp('2026-09-14T21:00:00.000Z'),
    });

    expect(record.didHitProteinTarget).toBe(true);
    expect(record.didAvoidLiquidCalories).toBe(false);
    expect(record.didCompleteMobilityRoutine).toBe(false);
  });

  /*
   * Numbers are not given the same treatment as ticks. "I did not answer" and
   * "I took zero steps" are different days, and only one of them belongs in an
   * average.
   */
  it('keeps an unanswered number null while preserving a recorded zero', () => {
    const record = fromDailyHabitDocument('2026-09-14', {
      stepCount: 0,
      updatedAt: buildFakeTimestamp('2026-09-14T21:00:00.000Z'),
    });

    expect(record.stepCount).toBe(0);
    expect(record.sleepHours).toBeNull();
  });

  it('survives a round trip unchanged', () => {
    const original = fromDailyHabitDocument('2026-09-14', {
      onDate: '2026-09-14',
      didHitProteinTarget: true,
      didAvoidLiquidCalories: false,
      didCompleteMobilityRoutine: true,
      stepCount: 8400,
      sleepHours: null,
      updatedAt: buildFakeTimestamp('2026-09-14T21:00:00.000Z'),
    });

    const readBack = fromDailyHabitDocument('2026-09-14', {
      ...toDailyHabitDocumentFields(original),
      updatedAt: buildFakeTimestamp(original.updatedAt.toISOString()),
    });

    expect(readBack).toEqual(original);
  });
});
