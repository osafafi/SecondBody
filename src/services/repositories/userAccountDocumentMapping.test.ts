import { describe, expect, it } from 'vitest';

import { DEFAULT_USER_SETTINGS } from '@/types/userAccountTypes';

import {
  fromUserProfileDocument,
  fromUserSettingsDocument,
  toUserProfileDocumentFields,
  toUserSettingsDocumentFields,
} from './userAccountDocumentMapping';

function buildFakeTimestamp(isoString: string) {
  return { toDate: () => new Date(isoString) };
}

function buildStoredProfile(overrides: Record<string, unknown> = {}) {
  return {
    displayName: 'Omar',
    birthYear: 1990,
    heightCentimetres: 178,
    startingWeightKilograms: 92,
    targetWeightKilograms: 83,
    painAreas: ['lowerBack', 'knees'],
    excludedExerciseIds: ['barbellBackSquat'],
    availableEquipmentIds: ['dumbbells', 'treadmill'],
    trainingDaysOfWeek: [1, 3, 5],
    hasCompletedOnboarding: true,
    createdAt: buildFakeTimestamp('2026-08-31T10:00:00.000Z'),
    updatedAt: buildFakeTimestamp('2026-08-31T11:00:00.000Z'),
    ...overrides,
  };
}

describe('reading a stored profile', () => {
  it('reads every field back', () => {
    const profile = fromUserProfileDocument(buildStoredProfile());

    expect(profile.displayName).toBe('Omar');
    expect(profile.birthYear).toBe(1990);
    expect(profile.heightCentimetres).toBe(178);
    expect(profile.startingWeightKilograms).toBe(92);
    expect(profile.targetWeightKilograms).toBe(83);
    expect(profile.painAreas).toEqual(['lowerBack', 'knees']);
    expect(profile.excludedExerciseIds).toEqual(['barbellBackSquat']);
    expect(profile.availableEquipmentIds).toEqual(['dumbbells', 'treadmill']);
    expect(profile.trainingDaysOfWeek).toEqual([1, 3, 5]);
    expect(profile.hasCompletedOnboarding).toBe(true);
  });

  it('turns stored timestamps into Dates, so nothing above services/ sees Firestore', () => {
    const profile = fromUserProfileDocument(buildStoredProfile());

    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.createdAt.toISOString()).toBe('2026-08-31T10:00:00.000Z');
    expect(profile.updatedAt.toISOString()).toBe('2026-08-31T11:00:00.000Z');
  });

  /*
   * The leniency rule. Content can rename or drop an equipment id between
   * releases, and an older profile still mentions the old one. Locking Omar out
   * of his own app over a machine that got renamed would be a poor trade.
   */
  it('drops equipment and pain areas it no longer recognises', () => {
    const profile = fromUserProfileDocument(
      buildStoredProfile({
        painAreas: ['knees', 'elbows', 'lowerBack'],
        availableEquipmentIds: ['dumbbells', 'smithMachine', 'treadmill'],
      }),
    );

    expect(profile.painAreas).toEqual(['knees', 'lowerBack']);
    expect(profile.availableEquipmentIds).toEqual(['dumbbells', 'treadmill']);
  });

  it('does not filter excluded exercise ids, which are a free-text blacklist', () => {
    const profile = fromUserProfileDocument(
      buildStoredProfile({ excludedExerciseIds: ['somethingAPhysioNamed'] }),
    );

    expect(profile.excludedExerciseIds).toEqual(['somethingAPhysioNamed']);
  });

  it('falls back to the default training days rather than storing "never train"', () => {
    expect(
      fromUserProfileDocument(buildStoredProfile({ trainingDaysOfWeek: [] })).trainingDaysOfWeek,
    ).toEqual([1, 3, 5]);
    expect(
      fromUserProfileDocument(buildStoredProfile({ trainingDaysOfWeek: [9, -1, 12] }))
        .trainingDaysOfWeek,
    ).toEqual([1, 3, 5]);
  });

  it('keeps the valid days when only some are nonsense', () => {
    const profile = fromUserProfileDocument(buildStoredProfile({ trainingDaysOfWeek: [1, 9, 5] }));

    expect(profile.trainingDaysOfWeek).toEqual([1, 5]);
  });

  it('throws, naming the field, when a required one is missing', () => {
    const storedProfile = buildStoredProfile();
    delete (storedProfile as Record<string, unknown>).heightCentimetres;

    expect(() => fromUserProfileDocument(storedProfile)).toThrow(/heightCentimetres/);
  });
});

describe('writing a profile', () => {
  it('survives a round trip unchanged', () => {
    const original = fromUserProfileDocument(buildStoredProfile());

    const writtenFields = toUserProfileDocumentFields(original);
    const readBack = fromUserProfileDocument({
      ...writtenFields,
      createdAt: buildFakeTimestamp(original.createdAt.toISOString()),
      updatedAt: buildFakeTimestamp(original.updatedAt.toISOString()),
    });

    expect(readBack).toEqual(original);
  });

  it('leaves the timestamps out, because they are written as server sentinels', () => {
    const writtenFields = toUserProfileDocumentFields(
      fromUserProfileDocument(buildStoredProfile()),
    );

    expect(writtenFields).not.toHaveProperty('createdAt');
    expect(writtenFields).not.toHaveProperty('updatedAt');
  });

  it('copies the arrays instead of aliasing the ones it was handed', () => {
    const painAreas: ('knees' | 'hips')[] = ['knees'];

    const writtenFields = toUserProfileDocumentFields({
      displayName: 'Omar',
      birthYear: 1990,
      heightCentimetres: 178,
      startingWeightKilograms: 92,
      targetWeightKilograms: 83,
      painAreas,
      excludedExerciseIds: [],
      availableEquipmentIds: [],
      trainingDaysOfWeek: [1, 3, 5],
      hasCompletedOnboarding: true,
    });

    painAreas.push('hips');

    expect(writtenFields.painAreas).toEqual(['knees']);
  });
});

describe('reading stored settings', () => {
  it('reads a fully populated document', () => {
    const settings = fromUserSettingsDocument({
      selectedPaletteId: 'emeraldTeal',
      coachVerbosity: 'detailed',
      defaultRestSeconds: 120,
      shouldPlayRestTimerSound: false,
      shouldKeepScreenAwakeDuringSession: false,
      weightUnit: 'lb',
      updatedAt: buildFakeTimestamp('2026-08-31T11:00:00.000Z'),
    });

    expect(settings.selectedPaletteId).toBe('emeraldTeal');
    expect(settings.coachVerbosity).toBe('detailed');
    expect(settings.defaultRestSeconds).toBe(120);
    expect(settings.shouldPlayRestTimerSound).toBe(false);
    expect(settings.shouldKeepScreenAwakeDuringSession).toBe(false);
    expect(settings.weightUnit).toBe('lb');
  });

  /*
   * This is the whole reason settings are read leniently: a preference added in
   * a later release is absent from every document written before it, and a
   * release that bricked the app until documents were migrated would be a bad
   * release.
   */
  it('fills in the default for any preference the document predates', () => {
    const settings = fromUserSettingsDocument({
      selectedPaletteId: 'emeraldTeal',
      updatedAt: buildFakeTimestamp('2026-08-31T11:00:00.000Z'),
    });

    expect(settings.selectedPaletteId).toBe('emeraldTeal');
    expect(settings.coachVerbosity).toBe(DEFAULT_USER_SETTINGS.coachVerbosity);
    expect(settings.defaultRestSeconds).toBe(DEFAULT_USER_SETTINGS.defaultRestSeconds);
    expect(settings.weightUnit).toBe(DEFAULT_USER_SETTINGS.weightUnit);
    expect(settings.shouldPlayRestTimerSound).toBe(DEFAULT_USER_SETTINGS.shouldPlayRestTimerSound);
  });

  it('keeps a stored false rather than treating it as absent', () => {
    const settings = fromUserSettingsDocument({
      shouldPlayRestTimerSound: false,
      updatedAt: buildFakeTimestamp('2026-08-31T11:00:00.000Z'),
    });

    expect(settings.shouldPlayRestTimerSound).toBe(false);
  });

  it('falls back to the default when a preference holds a value it does not recognise', () => {
    const settings = fromUserSettingsDocument({
      coachVerbosity: 'chatty',
      updatedAt: buildFakeTimestamp('2026-08-31T11:00:00.000Z'),
    });

    expect(settings.coachVerbosity).toBe(DEFAULT_USER_SETTINGS.coachVerbosity);
  });

  it('still requires updatedAt, which has been written since the first save', () => {
    expect(() => fromUserSettingsDocument({ selectedPaletteId: 'emeraldTeal' })).toThrow(
      /updatedAt/,
    );
  });
});

describe('writing settings', () => {
  it('survives a round trip unchanged', () => {
    const original = fromUserSettingsDocument({
      selectedPaletteId: 'amberCrimson',
      coachVerbosity: 'minimal',
      defaultRestSeconds: 75,
      shouldPlayRestTimerSound: true,
      shouldKeepScreenAwakeDuringSession: false,
      weightUnit: 'kg',
      updatedAt: buildFakeTimestamp('2026-08-31T11:00:00.000Z'),
    });

    const readBack = fromUserSettingsDocument({
      ...toUserSettingsDocumentFields(original),
      updatedAt: buildFakeTimestamp(original.updatedAt.toISOString()),
    });

    expect(readBack).toEqual(original);
  });
});
