import {
  PAIN_AREAS,
  type MovementCategory,
  type MovementPattern,
  type MuscleGroup,
  type PainArea,
} from '@/types/trainingVocabulary';

/**
 * How the shared training vocabulary reads on screen.
 *
 * `src/types/trainingVocabulary.ts` fixes the ids; this fixes the words. They
 * live in content rather than in a feature because onboarding asks these
 * questions once and Settings asks them again — and two features may not import
 * from each other, so the alternative is two lists that drift until "Lower back"
 * is "Low back" on one screen.
 */

/** The areas the programme knows how to work around. */
export const painAreaLabels: Record<PainArea, string> = {
  neck: 'Neck and traps',
  lowerBack: 'Lower back',
  shoulders: 'Shoulders',
  knees: 'Knees',
  hips: 'Hips',
  ankles: 'Ankles',
};

/**
 * Index is the value stored in `UserProfile.trainingDaysOfWeek`, where 0 is
 * Sunday — matching `Date.getDay()`, so a stored day can be compared to a real
 * one without a lookup table in between.
 */
export const dayOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * What the app calls each muscle group out loud.
 *
 * At the resolution the vocabulary uses rather than an anatomist's — see the
 * note on `MUSCLE_GROUPS`. `thoracicSpine` is a region, and calling it "upper
 * back mobility" is the honest reading of what the drills that target it do.
 */
export const muscleGroupLabels: Record<MuscleGroup, string> = {
  quadriceps: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  adductors: 'Inner thigh',
  calves: 'Calves',
  hipFlexors: 'Hip flexors',
  spinalErectors: 'Lower back',
  latissimusDorsi: 'Lats',
  midBack: 'Mid back',
  upperTraps: 'Upper traps',
  rearDeltoids: 'Rear delts',
  sideDeltoids: 'Side delts',
  frontDeltoids: 'Front delts',
  chest: 'Chest',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearmsAndGrip: 'Forearms and grip',
  abdominals: 'Abs',
  obliques: 'Obliques',
  deepNeckFlexors: 'Deep neck flexors',
  thoracicSpine: 'Upper back mobility',
};

/** The movement, in movement terms. What the exercise *is*, not what it works. */
export const movementPatternLabels: Record<MovementPattern, string> = {
  squat: 'Squat',
  hinge: 'Hinge',
  lunge: 'Lunge',
  horizontalPush: 'Horizontal push',
  horizontalPull: 'Horizontal pull',
  verticalPush: 'Vertical push',
  verticalPull: 'Vertical pull',
  carry: 'Carry',
  antiRotation: 'Anti-rotation',
  antiExtension: 'Anti-extension',
  isolation: 'Isolation',
  steadyStateCardio: 'Steady-state cardio',
  mobility: 'Mobility',
};

/** The three kinds of movement, as the library groups them. */
export const movementCategoryLabels: Record<MovementCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  mobility: 'Mobility',
};

/** Every pain area as a chip option, in the order the vocabulary lists them. */
export const painAreaChoiceOptions = PAIN_AREAS.map((painArea) => ({
  optionId: painArea,
  label: painAreaLabels[painArea],
}));

/** Every day of the week as a chip option, Sunday first. */
export const dayOfWeekChoiceOptions = dayOfWeekLabels.map((dayLabel, dayIndex) => ({
  optionId: String(dayIndex),
  label: dayLabel,
}));
