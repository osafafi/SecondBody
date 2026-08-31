import { PAIN_AREAS, type PainArea } from '@/types/trainingVocabulary';

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
