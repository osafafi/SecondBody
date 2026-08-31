import type { BodyMetricEntry, DailyHabitRecord } from '@/types/dailyTrackingTypes';

import { createDocumentReader } from './firestoreDocumentReading';

/**
 * Translating the scale and the daily habits between Firestore and the
 * application's types.
 *
 * The recurring decision in this file is that **null is a real answer**. An
 * unmeasured waist and a 0 cm waist are different facts, as are an unanswered
 * step count and a day spent on the sofa. Every optional field here is stored
 * and read as null rather than defaulted to zero, because the charts average
 * these numbers and a defaulted zero would drag a trend line down while looking
 * like data.
 */

// ---------------------------------------------------------------------------
// Body metrics
// ---------------------------------------------------------------------------

export function fromBodyMetricDocument(documentId: string, documentData: unknown): BodyMetricEntry {
  const reader = createDocumentReader(`bodyMetrics/${documentId}`, documentData);

  return {
    recordedOn: reader.requiredIsoDate('recordedOn'),
    weightKilograms: reader.optionalNumber('weightKilograms'),
    waistCentimetres: reader.optionalNumber('waistCentimetres'),
    chestCentimetres: reader.optionalNumber('chestCentimetres'),
    hipsCentimetres: reader.optionalNumber('hipsCentimetres'),
    notes: reader.optionalString('notes'),
    createdAt: reader.requiredInstant('createdAt'),
  };
}

/** Everything except `createdAt`, which is written with a server timestamp. */
export function toBodyMetricDocumentFields(
  entry: Omit<BodyMetricEntry, 'createdAt'>,
): Record<string, unknown> {
  return {
    recordedOn: entry.recordedOn,
    weightKilograms: entry.weightKilograms,
    waistCentimetres: entry.waistCentimetres,
    chestCentimetres: entry.chestCentimetres,
    hipsCentimetres: entry.hipsCentimetres,
    notes: entry.notes,
  };
}

// ---------------------------------------------------------------------------
// Daily habits
// ---------------------------------------------------------------------------

export function fromDailyHabitDocument(
  documentId: string,
  documentData: unknown,
): DailyHabitRecord {
  const reader = createDocumentReader(`dailyHabits/${documentId}`, documentData);

  return {
    /*
     * The document id IS the date, so it is the source of truth. The stored
     * `onDate` field exists to make an exported document readable on its own,
     * and it is ignored here if the two ever disagree.
     */
    onDate: documentId,

    /*
     * The three ticks default to false rather than being required. A row added
     * to the checklist in a later release is absent from every day recorded
     * before it, and "not ticked" is exactly what that absence means.
     */
    didHitProteinTarget: reader.optionalBoolean('didHitProteinTarget') ?? false,
    didAvoidLiquidCalories: reader.optionalBoolean('didAvoidLiquidCalories') ?? false,
    didCompleteMobilityRoutine: reader.optionalBoolean('didCompleteMobilityRoutine') ?? false,

    stepCount: reader.optionalNumber('stepCount'),
    sleepHours: reader.optionalNumber('sleepHours'),

    updatedAt: reader.requiredInstant('updatedAt'),
  };
}

/** Everything except `updatedAt`. */
export function toDailyHabitDocumentFields(
  record: Omit<DailyHabitRecord, 'updatedAt'>,
): Record<string, unknown> {
  return {
    onDate: record.onDate,
    didHitProteinTarget: record.didHitProteinTarget,
    didAvoidLiquidCalories: record.didAvoidLiquidCalories,
    didCompleteMobilityRoutine: record.didCompleteMobilityRoutine,
    stepCount: record.stepCount,
    sleepHours: record.sleepHours,
  };
}
