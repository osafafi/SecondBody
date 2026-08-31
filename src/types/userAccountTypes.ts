import type { CoachVerbosityLevel } from './coachVoiceTypes';
import type { EquipmentId, PainArea } from './trainingVocabulary';

/**
 * The two documents that describe the person using the app: who they are, and
 * how they want the app to behave.
 *
 * **Instants are `Date`, never Firestore's `Timestamp`.** Nothing outside
 * `src/services/` should know that Firestore exists — see CLAUDE.md section 3 —
 * and `src/domain/` reaches these types too. Converting between the two is the
 * repository's job, and is exactly the "translation logic" CLAUDE.md section 5
 * asks to be tested with fakes.
 */

/** `users/{userId}/profile/current`. */
export type UserProfile = {
  displayName: string;
  birthYear: number;
  heightCentimetres: number;
  startingWeightKilograms: number;
  targetWeightKilograms: number;

  /** Drives which exercises the programme is allowed to prescribe. */
  painAreas: PainArea[];

  /** Hard blacklist, e.g. something a physio ruled out. Beats everything else. */
  excludedExerciseIds: string[];

  /** What the gym he is actually standing in has. */
  availableEquipmentIds: EquipmentId[];

  /** 0 is Sunday, matching `Date.getDay()`. Defaults to Monday/Wednesday/Friday. */
  trainingDaysOfWeek: number[];

  hasCompletedOnboarding: boolean;

  createdAt: Date;
  updatedAt: Date;
};

/** The weight unit shown in the interface. Storage is always kilograms. */
export const WEIGHT_UNITS = ['kg', 'lb'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

/** `users/{userId}/settings/current`. */
export type UserSettings = {
  selectedPaletteId: string;
  coachVerbosity: CoachVerbosityLevel;
  defaultRestSeconds: number;
  shouldPlayRestTimerSound: boolean;
  shouldKeepScreenAwakeDuringSession: boolean;

  /**
   * Display only. Every stored weight is kilograms regardless, so switching this
   * can never alter a recorded number — it changes how one is rendered.
   */
  weightUnit: WeightUnit;

  updatedAt: Date;
};

/**
 * The defaults a brand new account starts with.
 *
 * Kept beside the type rather than inside the repository so the onboarding
 * screen and the settings screen agree about what "unset" means without either
 * one owning the answer.
 */
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'updatedAt'> = {
  selectedPaletteId: 'purpleBlue',
  coachVerbosity: 'standard',
  defaultRestSeconds: 90,
  shouldPlayRestTimerSound: true,
  shouldKeepScreenAwakeDuringSession: true,
  weightUnit: 'kg',
};

/** Monday, Wednesday, Friday. See docs/TRAINING_PROGRAM.md section 1. */
export const DEFAULT_TRAINING_DAYS_OF_WEEK = [1, 3, 5];
