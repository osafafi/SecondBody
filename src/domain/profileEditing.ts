import type { PainArea } from '@/types/trainingVocabulary';
import type { UserProfile } from '@/types/userAccountTypes';

import {
  findTrainingDayProblems,
  isPlausibleBodyWeightKilograms,
  isPlausibleHeightCentimetres,
  MAXIMUM_HEIGHT_CENTIMETRES,
  MAXIMUM_WEIGHT_KILOGRAMS,
  MINIMUM_HEIGHT_CENTIMETRES,
  MINIMUM_WEIGHT_KILOGRAMS,
} from './onboardingValidation';

/**
 * Changing the answers onboarding collected, months later, from Settings.
 *
 * The bounds are not restated here — they are imported from
 * `onboardingValidation.ts`, because a height the onboarding form accepts and
 * the settings form rejects is the kind of disagreement nobody finds until it
 * happens to them.
 *
 * **Four of the eight profile fields are deliberately not editable**, and each
 * is left out for a reason rather than because it was awkward:
 *
 * - `startingWeightKilograms` is the baseline the whole weight trend is measured
 *   from. Editing it would silently rewrite what every past weigh-in meant. A
 *   new starting point is a new programme, not a corrected field.
 * - `birthYear` is asked once and used nowhere that would change if it moved.
 * - `availableEquipmentIds` belongs to the gym rather than the person, and a
 *   changed gym is a bigger conversation than a chip grid — the programme's
 *   prescriptions are built on it.
 * - `excludedExerciseIds` is the hard blacklist that beats everything else. It
 *   exists for something a physio ruled out, and that should not be one
 *   mis-tap away from being switched back on.
 */

/** The subset of the profile that Settings is allowed to change. */
export type EditableProfileFields = {
  displayName: string;

  /** Null while the field is being retyped, which is not the same as zero. */
  heightCentimetres: number | null;

  targetWeightKilograms: number | null;

  /** 0 is Sunday, matching `Date.getDay()`. */
  trainingDaysOfWeek: number[];

  painAreas: PainArea[];
};

/** The editable fields as they currently stand, to open the form on. */
export function readEditableProfileFields(profile: UserProfile): EditableProfileFields {
  return {
    displayName: profile.displayName,
    heightCentimetres: profile.heightCentimetres,
    targetWeightKilograms: profile.targetWeightKilograms,
    trainingDaysOfWeek: [...profile.trainingDaysOfWeek],
    painAreas: [...profile.painAreas],
  };
}

/**
 * What is wrong with the edited fields, as sentences to show.
 *
 * Only the fields this form can actually change are checked. A stored value the
 * form cannot reach must never produce a complaint, because there would be no
 * way to act on it — the user would be looking at an error about a field that is
 * not on the screen.
 */
export function findProfileEditProblems(edits: EditableProfileFields): string[] {
  const problems: string[] = [];

  if (edits.displayName.trim().length === 0) {
    problems.push('Your name cannot be blank.');
  }

  if (!isPlausibleHeightCentimetres(edits.heightCentimetres)) {
    problems.push(
      `Height should be between ${String(MINIMUM_HEIGHT_CENTIMETRES)} and ${String(MAXIMUM_HEIGHT_CENTIMETRES)} cm.`,
    );
  }

  if (!isPlausibleBodyWeightKilograms(edits.targetWeightKilograms)) {
    problems.push(
      `Target weight should be between ${String(MINIMUM_WEIGHT_KILOGRAMS)} and ${String(MAXIMUM_WEIGHT_KILOGRAMS)} kg.`,
    );
  }

  problems.push(...findTrainingDayProblems(edits.trainingDaysOfWeek));

  return problems;
}

/**
 * True when the form is showing something different from what is stored.
 *
 * Drives whether the save button is offered at all. Order is ignored for the two
 * lists: unticking Wednesday and ticking it again is not a change, and offering
 * to save one would train somebody to press a button that does nothing.
 */
export function hasProfileEdits(profile: UserProfile, edits: EditableProfileFields): boolean {
  const haveSameMembers = (
    left: readonly (string | number)[],
    right: readonly (string | number)[],
  ) => left.length === right.length && left.every((member) => right.includes(member));

  return (
    edits.displayName.trim() !== profile.displayName ||
    edits.heightCentimetres !== profile.heightCentimetres ||
    edits.targetWeightKilograms !== profile.targetWeightKilograms ||
    !haveSameMembers(edits.trainingDaysOfWeek, profile.trainingDaysOfWeek) ||
    !haveSameMembers(edits.painAreas, profile.painAreas)
  );
}

/**
 * The whole profile to write, with the edits folded in.
 *
 * The unedited fields are carried through explicitly rather than left to a merge
 * on the way out, so that what gets written is visible here rather than
 * depending on what happens to already be in Firestore.
 *
 * Throws when a nullable field is still empty. Reaching here means
 * `findProfileEditProblems` returned nothing, so they are answered — but that is
 * a fact about the caller rather than something the compiler knows, and a
 * non-null `!` would turn a caller's mistake into a height of zero written to
 * the document the whole programme is built on.
 */
export function applyProfileEdits(
  profile: UserProfile,
  edits: EditableProfileFields,
): Omit<UserProfile, 'createdAt' | 'updatedAt'> {
  const { heightCentimetres, targetWeightKilograms } = edits;

  if (heightCentimetres === null || targetWeightKilograms === null) {
    throw new Error('Tried to save a profile edit before every field was answered.');
  }

  return {
    displayName: edits.displayName.trim(),
    birthYear: profile.birthYear,
    heightCentimetres,
    startingWeightKilograms: profile.startingWeightKilograms,
    targetWeightKilograms,
    painAreas: [...edits.painAreas],
    excludedExerciseIds: [...profile.excludedExerciseIds],
    availableEquipmentIds: [...profile.availableEquipmentIds],
    trainingDaysOfWeek: [...edits.trainingDaysOfWeek].sort((left, right) => left - right),
    hasCompletedOnboarding: profile.hasCompletedOnboarding,
  };
}
