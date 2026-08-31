import {
  DEFAULT_TRAINING_DAYS_OF_WEEK,
  DEFAULT_USER_SETTINGS,
  WEIGHT_UNITS,
  type UserProfile,
  type UserSettings,
} from '@/types/userAccountTypes';
import { COACH_VERBOSITY_LEVELS } from '@/types/coachVoiceTypes';
import {
  EQUIPMENT_IDS,
  PAIN_AREAS,
  type EquipmentId,
  type PainArea,
} from '@/types/trainingVocabulary';

import { createDocumentReader } from './firestoreDocumentReading';

/**
 * Translating `profile/current` and `settings/current` between Firestore and the
 * application's types.
 *
 * Split out from the repositories because this is the part with decisions in it.
 * The repositories themselves are four lines of Firestore call each, and
 * CLAUDE.md section 5 says to test the translation rather than Firebase.
 *
 * The `to*` functions deliberately do **not** produce `createdAt` or `updatedAt`.
 * Those are written with `serverTimestamp()`, which is a Firestore sentinel
 * rather than a value, and keeping it out of here is what lets these functions
 * be pure.
 */

/**
 * Unknown members of a closed vocabulary are dropped, not rejected.
 *
 * If an equipment id or a pain area is renamed or removed in `src/content/`, an
 * older profile still mentions it. Throwing would lock the owner out of their own
 * app over a piece of gym equipment; dropping it silently degrades to "the gym
 * has one fewer machine", which is both recoverable and true.
 *
 * This is the opposite of how `status` fields are treated, and deliberately so —
 * those are small, closed and load-bearing, so a bad one is a bug worth hearing
 * about.
 */
function keepKnownMembers<TMember extends string>(
  storedValues: string[],
  allowedValues: readonly TMember[],
): TMember[] {
  return storedValues.filter((value): value is TMember =>
    (allowedValues as readonly string[]).includes(value),
  );
}

/** Days outside 0-6 cannot be a weekday, whatever they were meant to be. */
function keepValidDaysOfWeek(storedDays: number[]): number[] {
  return storedDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

export function fromUserProfileDocument(documentData: unknown): UserProfile {
  const reader = createDocumentReader('profile/current', documentData);

  const storedTrainingDays = keepValidDaysOfWeek(reader.numberArray('trainingDaysOfWeek'));

  return {
    displayName: reader.requiredString('displayName'),
    birthYear: reader.requiredNumber('birthYear'),
    heightCentimetres: reader.requiredNumber('heightCentimetres'),
    startingWeightKilograms: reader.requiredNumber('startingWeightKilograms'),
    targetWeightKilograms: reader.requiredNumber('targetWeightKilograms'),

    painAreas: keepKnownMembers<PainArea>(reader.stringArray('painAreas'), PAIN_AREAS),
    excludedExerciseIds: reader.stringArray('excludedExerciseIds'),
    availableEquipmentIds: keepKnownMembers<EquipmentId>(
      reader.stringArray('availableEquipmentIds'),
      EQUIPMENT_IDS,
    ),

    /*
     * An empty list would mean "never train", which is never what was meant —
     * it means the field was lost. Fall back to the default three days.
     */
    trainingDaysOfWeek:
      storedTrainingDays.length > 0 ? storedTrainingDays : [...DEFAULT_TRAINING_DAYS_OF_WEEK],

    hasCompletedOnboarding: reader.requiredBoolean('hasCompletedOnboarding'),

    createdAt: reader.requiredInstant('createdAt'),
    updatedAt: reader.requiredInstant('updatedAt'),
  };
}

/** Everything except the server-managed timestamps. */
export function toUserProfileDocumentFields(
  profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>,
): Record<string, unknown> {
  return {
    displayName: profile.displayName,
    birthYear: profile.birthYear,
    heightCentimetres: profile.heightCentimetres,
    startingWeightKilograms: profile.startingWeightKilograms,
    targetWeightKilograms: profile.targetWeightKilograms,
    painAreas: [...profile.painAreas],
    excludedExerciseIds: [...profile.excludedExerciseIds],
    availableEquipmentIds: [...profile.availableEquipmentIds],
    trainingDaysOfWeek: [...profile.trainingDaysOfWeek],
    hasCompletedOnboarding: profile.hasCompletedOnboarding,
  };
}

/**
 * Reads `settings/current`, falling back to the default for any field that is
 * absent.
 *
 * Settings are the one document where a missing OR unrecognised field is
 * genuinely harmless: every preference has a sensible default, and a later
 * release both adds new preferences and can rename the options of an existing
 * one. Throwing on either would mean a release could brick the app until every
 * document was migrated.
 *
 * That is why the unions here are read with `recognisedMemberOf` rather than
 * `optionalMemberOf` — the latter still throws on a value it does not know, and
 * for a stored preference that is the wrong call.
 */
export function fromUserSettingsDocument(documentData: unknown): UserSettings {
  const reader = createDocumentReader('settings/current', documentData);

  return {
    selectedPaletteId:
      reader.optionalString('selectedPaletteId') ?? DEFAULT_USER_SETTINGS.selectedPaletteId,

    coachVerbosity:
      reader.recognisedMemberOf('coachVerbosity', COACH_VERBOSITY_LEVELS) ??
      DEFAULT_USER_SETTINGS.coachVerbosity,

    defaultRestSeconds:
      reader.optionalNumber('defaultRestSeconds') ?? DEFAULT_USER_SETTINGS.defaultRestSeconds,

    shouldPlayRestTimerSound:
      reader.optionalBoolean('shouldPlayRestTimerSound') ??
      DEFAULT_USER_SETTINGS.shouldPlayRestTimerSound,

    shouldKeepScreenAwakeDuringSession:
      reader.optionalBoolean('shouldKeepScreenAwakeDuringSession') ??
      DEFAULT_USER_SETTINGS.shouldKeepScreenAwakeDuringSession,

    weightUnit:
      reader.recognisedMemberOf('weightUnit', WEIGHT_UNITS) ?? DEFAULT_USER_SETTINGS.weightUnit,

    /*
     * Required, unlike every field above it. The leniency here is for
     * preferences added in a later release, which are legitimately absent from
     * documents written before them. `updatedAt` has been written since the
     * first save, so its absence means something is actually wrong.
     */
    updatedAt: reader.requiredInstant('updatedAt'),
  };
}

/** Everything except `updatedAt`. */
export function toUserSettingsDocumentFields(
  settings: Omit<UserSettings, 'updatedAt'>,
): Record<string, unknown> {
  return {
    selectedPaletteId: settings.selectedPaletteId,
    coachVerbosity: settings.coachVerbosity,
    defaultRestSeconds: settings.defaultRestSeconds,
    shouldPlayRestTimerSound: settings.shouldPlayRestTimerSound,
    shouldKeepScreenAwakeDuringSession: settings.shouldKeepScreenAwakeDuringSession,
    weightUnit: settings.weightUnit,
  };
}
