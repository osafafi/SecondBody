import { describe, expect, it } from 'vitest';

import {
  createDocumentReader,
  isValidIsoDate,
  readInstantOrNull,
} from './firestoreDocumentReading';

/** Stands in for a Firestore `Timestamp`, which is recognised by duck typing. */
function buildFakeTimestamp(isoString: string) {
  return { toDate: () => new Date(isoString) };
}

describe('recognising an ISO date', () => {
  it('accepts a real calendar day', () => {
    expect(isValidIsoDate('2026-09-01')).toBe(true);
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2024-02-29')).toBe(true); // 2024 was a leap year.
  });

  it('rejects a day that does not exist', () => {
    // 2026 is not a leap year, so the 29th rolls forward to 1 March.
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2026-02-31')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
  });

  it('rejects anything that is not YYYY-MM-DD', () => {
    expect(isValidIsoDate('2026-9-1')).toBe(false);
    expect(isValidIsoDate('01/09/2026')).toBe(false);
    expect(isValidIsoDate('2026-09-01T10:00:00Z')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
  });
});

describe('converting a stored instant', () => {
  it('unwraps a Firestore timestamp through toDate()', () => {
    const instant = readInstantOrNull(buildFakeTimestamp('2026-08-31T10:00:00.000Z'));

    expect(instant?.toISOString()).toBe('2026-08-31T10:00:00.000Z');
  });

  it('passes a Date straight through', () => {
    const date = new Date('2026-08-31T10:00:00.000Z');

    expect(readInstantOrNull(date)).toBe(date);
  });

  it('rejects values that are not instants at all', () => {
    expect(readInstantOrNull(null)).toBeNull();
    expect(readInstantOrNull(undefined)).toBeNull();
    expect(readInstantOrNull('2026-08-31')).toBeNull();
    expect(readInstantOrNull(1_756_636_800_000)).toBeNull();
    expect(readInstantOrNull({ toDate: 'not a function' })).toBeNull();
  });

  it('rejects an invalid Date rather than passing NaN onwards', () => {
    expect(readInstantOrNull(new Date('nonsense'))).toBeNull();
    expect(readInstantOrNull({ toDate: () => new Date('nonsense') })).toBeNull();
  });
});

describe('reading required fields', () => {
  const reader = createDocumentReader('profile/current', {
    displayName: 'Omar',
    birthYear: 1990,
    hasCompletedOnboarding: true,
    startedOn: '2026-09-01',
    createdAt: buildFakeTimestamp('2026-08-31T10:00:00.000Z'),
  });

  it('reads each type it is given', () => {
    expect(reader.requiredString('displayName')).toBe('Omar');
    expect(reader.requiredNumber('birthYear')).toBe(1990);
    expect(reader.requiredBoolean('hasCompletedOnboarding')).toBe(true);
    expect(reader.requiredIsoDate('startedOn')).toBe('2026-09-01');
    expect(reader.requiredInstant('createdAt').toISOString()).toBe('2026-08-31T10:00:00.000Z');
  });

  it('names the document and the field when one is missing', () => {
    expect(() => reader.requiredString('heightCentimetres')).toThrow(/profile\/current/);
    expect(() => reader.requiredString('heightCentimetres')).toThrow(/heightCentimetres/);
  });

  it('names the field when one is the wrong type', () => {
    expect(() => reader.requiredNumber('displayName')).toThrow(/should be a finite number/);
    expect(() => reader.requiredString('birthYear')).toThrow(/should be a string/);
  });

  it('rejects NaN and Infinity, which would poison every chart downstream', () => {
    const numericReader = createDocumentReader('bodyMetrics/x', {
      weightKilograms: Number.NaN,
      targetWeightKilograms: Number.POSITIVE_INFINITY,
    });

    expect(() => numericReader.requiredNumber('weightKilograms')).toThrow();
    expect(() => numericReader.requiredNumber('targetWeightKilograms')).toThrow();
  });
});

describe('reading optional fields', () => {
  const reader = createDocumentReader('bodyMetrics/abc', {
    weightKilograms: 88.4,
    waistCentimetres: null,
    notes: 'felt heavy',
  });

  it('reads a value that is present', () => {
    expect(reader.optionalNumber('weightKilograms')).toBe(88.4);
    expect(reader.optionalString('notes')).toBe('felt heavy');
  });

  it('treats an explicit null and a missing field the same way', () => {
    expect(reader.optionalNumber('waistCentimetres')).toBeNull();
    expect(reader.optionalNumber('chestCentimetres')).toBeNull();
  });

  it('still rejects a present value of the wrong type', () => {
    expect(() => reader.optionalNumber('notes')).toThrow(/should be a finite number/);
  });

  it('distinguishes a recorded zero from an unanswered field', () => {
    const habitReader = createDocumentReader('dailyHabits/2026-09-01', { stepCount: 0 });

    expect(habitReader.optionalNumber('stepCount')).toBe(0);
    expect(habitReader.optionalNumber('sleepHours')).toBeNull();
  });
});

describe('reading union members', () => {
  const statuses = ['active', 'completed', 'abandoned'] as const;

  it('accepts a value that is in the union', () => {
    const reader = createDocumentReader('programAssignments/x', { status: 'active' });

    expect(reader.requiredMemberOf('status', statuses)).toBe('active');
  });

  it('rejects a value that is not, and lists what was allowed', () => {
    const reader = createDocumentReader('programAssignments/x', { status: 'paused' });

    expect(() => reader.requiredMemberOf('status', statuses)).toThrow(
      /active, completed, abandoned/,
    );
  });

  it('allows an absent optional member', () => {
    const reader = createDocumentReader('workoutSessions/x', {});

    expect(reader.optionalMemberOf('overallFeeling', ['strong', 'normal', 'rough'])).toBeNull();
  });
});

describe('reading arrays', () => {
  it('reads arrays of the expected element type', () => {
    const reader = createDocumentReader('profile/current', {
      painAreas: ['knees', 'lowerBack'],
      trainingDaysOfWeek: [1, 3, 5],
      performedExercises: [{ exerciseId: 'gobletSquat' }],
    });

    expect(reader.stringArray('painAreas')).toEqual(['knees', 'lowerBack']);
    expect(reader.numberArray('trainingDaysOfWeek')).toEqual([1, 3, 5]);
    expect(reader.objectArray('performedExercises')).toEqual([{ exerciseId: 'gobletSquat' }]);
  });

  it('treats a missing array as empty rather than throwing', () => {
    const reader = createDocumentReader('profile/current', {});

    expect(reader.stringArray('excludedExerciseIds')).toEqual([]);
    expect(reader.numberArray('trainingDaysOfWeek')).toEqual([]);
    expect(reader.objectArray('performedExercises')).toEqual([]);
  });

  it('rejects an array with a wrong element in it', () => {
    const reader = createDocumentReader('profile/current', {
      painAreas: ['knees', 7],
      trainingDaysOfWeek: [1, 'Wednesday'],
      performedExercises: [null],
    });

    expect(() => reader.stringArray('painAreas')).toThrow(/array of strings/);
    expect(() => reader.numberArray('trainingDaysOfWeek')).toThrow(/array of finite numbers/);
    expect(() => reader.objectArray('performedExercises')).toThrow(/array of objects/);
  });

  it('rejects a non-array where an array belongs', () => {
    const reader = createDocumentReader('profile/current', { painAreas: 'knees' });

    expect(() => reader.stringArray('painAreas')).toThrow(/array of strings/);
  });
});

describe('reading a document that is not an object at all', () => {
  it('reports the missing field rather than crashing', () => {
    const reader = createDocumentReader('profile/current', undefined);

    expect(() => reader.requiredString('displayName')).toThrow(/profile\/current/);
    expect(reader.optionalString('displayName')).toBeNull();
  });
});
