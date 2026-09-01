import type { CoachLine } from '@/types/coachVoiceTypes';

/**
 * What Harout says about writing things down.
 *
 * The quietest set of lines in the app, on purpose. The journal is the one
 * screen where the user is doing the talking, and a coach who talks over that
 * is a coach nobody writes to. Nothing here asks a question, nothing here
 * congratulates anybody for typing, and nothing here suggests there is a right
 * way to do it.
 */
export const journalCoachLines: CoachLine[] = [
  // ---------------------------------------------------------------------------
  // Inviting a note
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'journalPrompt.aSentenceIsPlenty',
    category: 'journalPrompt',
    text: 'Anything worth writing down? A sentence is plenty.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'journalPrompt.whileYouRememberIt',
    category: 'journalPrompt',
    text: 'If something felt off today, put it here while you still remember it.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'journalPrompt.questionsCountToo',
    category: 'journalPrompt',
    text: 'Questions count too. You do not have to know the answer to write one down.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'journalPrompt.nobodyIsMarkingThis',
    category: 'journalPrompt',
    text: 'Write it how you would say it. Nobody is marking this.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // After an entry is saved
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'journalEntrySaved.oneLessThingToRemember',
    category: 'journalEntrySaved',
    text: 'Saved. That is one less thing to carry around.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'journalEntrySaved.itWillBeThere',
    category: 'journalEntrySaved',
    text: 'Got it. It will still be there when we go through things properly.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'journalEntrySaved.betterThanRecalling',
    category: 'journalEntrySaved',
    text: 'Written down beats remembered. You will not have to reconstruct this on a Sunday.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },
];
