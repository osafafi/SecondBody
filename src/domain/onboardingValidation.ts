import type { EquipmentId, PainArea } from '@/types/trainingVocabulary';

/**
 * Checking that the answers onboarding collected are usable.
 *
 * These are the numbers the whole programme is then built on — a height that is
 * really a weight, or a target of 8 kg instead of 80, would propagate into every
 * prescription the app ever makes. Catching it at the point of entry is far
 * cheaper than noticing it six weeks in.
 *
 * **No clock read.** `src/domain/` must stay deterministic, so the current year
 * is passed in rather than looked up. That is also what makes the birth-year
 * bounds testable without freezing time.
 */

/** The steps, in the order they are asked. */
export const ONBOARDING_STEP_IDS = [
  'aboutYou',
  'startingPoint',
  'painAreas',
  'equipment',
  'schedule',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

/**
 * The answers as they are being typed, which is why the numbers are nullable —
 * an empty number field is not a zero.
 */
export type OnboardingDraft = {
  displayName: string;
  birthYear: number | null;
  heightCentimetres: number | null;
  startingWeightKilograms: number | null;
  targetWeightKilograms: number | null;
  painAreas: PainArea[];
  availableEquipmentIds: EquipmentId[];
  trainingDaysOfWeek: number[];
};

/*
 * Bounds wide enough to never argue with a real person, narrow enough to catch a
 * slipped decimal point or a height typed into the weight box.
 */
export const MINIMUM_TRAINING_AGE_YEARS = 13;
export const MAXIMUM_PLAUSIBLE_AGE_YEARS = 100;
export const MINIMUM_HEIGHT_CENTIMETRES = 120;
export const MAXIMUM_HEIGHT_CENTIMETRES = 230;
export const MINIMUM_WEIGHT_KILOGRAMS = 30;
export const MAXIMUM_WEIGHT_KILOGRAMS = 300;

function isNumberWithin(value: number | null, minimum: number, maximum: number): boolean {
  return value !== null && Number.isFinite(value) && value >= minimum && value <= maximum;
}

/*
 * The three checks below are exported because Settings edits the same three
 * answers after onboarding is over — see `profileEditing.ts`. They are shared
 * rather than restated so that the bounds cannot drift apart, which would mean
 * a height the onboarding form accepts and the settings form rejects.
 */

/** True when a height is a height rather than a weight typed into the wrong box. */
export function isPlausibleHeightCentimetres(heightCentimetres: number | null): boolean {
  return isNumberWithin(heightCentimetres, MINIMUM_HEIGHT_CENTIMETRES, MAXIMUM_HEIGHT_CENTIMETRES);
}

/** True when a body weight is plausible for a person, with no view on direction. */
export function isPlausibleBodyWeightKilograms(weightKilograms: number | null): boolean {
  return isNumberWithin(weightKilograms, MINIMUM_WEIGHT_KILOGRAMS, MAXIMUM_WEIGHT_KILOGRAMS);
}

/** What is wrong with a set of training days, as sentences. Empty when it is fine. */
export function findTrainingDayProblems(trainingDaysOfWeek: number[]): string[] {
  const problems: string[] = [];

  if (trainingDaysOfWeek.length === 0) {
    problems.push('Pick at least one training day.');
  }

  if (trainingDaysOfWeek.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    problems.push('Training days must be days of the week.');
  }

  return problems;
}

/**
 * What is wrong with one step, as sentences to show the user.
 *
 * An empty array means the step is answered. Returning every problem at once
 * rather than only the first means a form with two blank fields says so once,
 * instead of revealing the second complaint after the first is fixed.
 */
export function findOnboardingStepProblems(
  stepId: OnboardingStepId,
  draft: OnboardingDraft,
  currentYear: number,
): string[] {
  const problems: string[] = [];

  if (stepId === 'aboutYou') {
    if (draft.displayName.trim().length === 0) {
      problems.push('Your name cannot be blank.');
    }

    const earliestPlausibleBirthYear = currentYear - MAXIMUM_PLAUSIBLE_AGE_YEARS;
    const latestPlausibleBirthYear = currentYear - MINIMUM_TRAINING_AGE_YEARS;

    if (!isNumberWithin(draft.birthYear, earliestPlausibleBirthYear, latestPlausibleBirthYear)) {
      problems.push(
        `Birth year should be between ${String(earliestPlausibleBirthYear)} and ${String(latestPlausibleBirthYear)}.`,
      );
    }

    if (!isPlausibleHeightCentimetres(draft.heightCentimetres)) {
      problems.push(
        `Height should be between ${String(MINIMUM_HEIGHT_CENTIMETRES)} and ${String(MAXIMUM_HEIGHT_CENTIMETRES)} cm.`,
      );
    }
  }

  if (stepId === 'startingPoint') {
    if (!isPlausibleBodyWeightKilograms(draft.startingWeightKilograms)) {
      problems.push(
        `Current weight should be between ${String(MINIMUM_WEIGHT_KILOGRAMS)} and ${String(MAXIMUM_WEIGHT_KILOGRAMS)} kg.`,
      );
    }

    /*
     * The target is checked for plausibility but NOT for direction. Body
     * recomposition can mean the scale going up, down or nowhere — see
     * docs/TRAINING_PROGRAM.md. Insisting the target be lower would be the app
     * assuming a goal it was not told about.
     */
    if (!isPlausibleBodyWeightKilograms(draft.targetWeightKilograms)) {
      problems.push(
        `Target weight should be between ${String(MINIMUM_WEIGHT_KILOGRAMS)} and ${String(MAXIMUM_WEIGHT_KILOGRAMS)} kg.`,
      );
    }
  }

  /*
   * `painAreas` has no step of its own in this list on purpose: having nothing
   * that hurts is a perfectly good answer, and the commonest one to want.
   */

  if (stepId === 'equipment' && draft.availableEquipmentIds.length === 0) {
    problems.push('Pick at least one thing you can train with.');
  }

  if (stepId === 'schedule') {
    problems.push(...findTrainingDayProblems(draft.trainingDaysOfWeek));
  }

  return problems;
}

/** True when every step would pass, so the profile can be written. */
export function isOnboardingDraftComplete(draft: OnboardingDraft, currentYear: number): boolean {
  return ONBOARDING_STEP_IDS.every(
    (stepId) => findOnboardingStepProblems(stepId, draft, currentYear).length === 0,
  );
}
