import type { CoachLine, CoachLineCategory } from '@/types/coachVoiceTypes';

import { authenticationCoachLines } from './authenticationCoachLines';
import { habitCoachLines } from './habitCoachLines';
import { onboardingCoachLines } from './onboardingCoachLines';
import { programCoachLines } from './programCoachLines';
import { sessionCoachLines } from './sessionCoachLines';
import { setFeedbackCoachLines } from './setFeedbackCoachLines';

/**
 * Every line Harout can say.
 *
 * Components never write coach copy of their own — they ask for a category and
 * render whatever comes back. That is what makes the tone adjustable by editing
 * the files in this folder instead of hunting through JSX.
 *
 * Choosing between the lines in a category is `src/domain/coachLineSelection.ts`,
 * which is where the "praise is earned and rationed" rule actually lives.
 */
export const allCoachLines: CoachLine[] = [
  ...authenticationCoachLines,
  ...onboardingCoachLines,
  ...sessionCoachLines,
  ...setFeedbackCoachLines,
  ...programCoachLines,
  ...habitCoachLines,
];

/** Every line written for one moment, in the order they were authored. */
export function findCoachLinesByCategory(category: CoachLineCategory): CoachLine[] {
  return allCoachLines.filter((coachLine) => coachLine.category === category);
}
