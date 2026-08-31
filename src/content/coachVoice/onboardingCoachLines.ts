import type { CoachLine } from '@/types/coachVoiceTypes';

/**
 * What Harout says while the profile is being filled in.
 *
 * Onboarding is a form, and a form is where enthusiasm is least welcome. These
 * lines do one job: say why a question is being asked, so answering it feels
 * like setting something up rather than being processed.
 *
 * Nothing here is praise. Filling in a form is not an achievement, and spending
 * praise on it would devalue the lines that are for the moments that are.
 */
export const onboardingCoachLines: CoachLine[] = [
  // ---------------------------------------------------------------------------
  // Opening
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'onboardingOpening.quickQuestions',
    category: 'onboardingOpening',
    text: "A few questions, then we're done with forms for good.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'onboardingOpening.everythingIsChangeable',
    category: 'onboardingOpening',
    text: 'None of this is locked in. You can change any of it later.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'onboardingOpening.whyIAsk',
    category: 'onboardingOpening',
    text: "I'm asking so the programme fits you rather than a generic person. Answer honestly, not optimistically.",
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // Finished
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'onboardingFinished.thatsTheAdmin',
    category: 'onboardingFinished',
    text: "That's the admin done. Let's get to work.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'onboardingFinished.builtAroundYou',
    category: 'onboardingFinished',
    text: 'Everything from here is built around what you just told me.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'onboardingFinished.firstWeekIsCalibration',
    category: 'onboardingFinished',
    text: "The first week is about finding your starting weights, so it'll feel light. That's the point.",
    minimumVerbosity: 'detailed',
    isPraise: false,
  },
];
