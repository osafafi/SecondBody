import type { CoachLine } from '@/types/coachVoiceTypes';

/**
 * What Harout says on the sign-in screen.
 *
 * The only moment he speaks before knowing who he is speaking to, which rules
 * out anything personal. These lines do two jobs: get the tone right from the
 * first screen, and answer — without being asked — the two questions a sign-in
 * wall provokes. Where does my data go, and who else can see it.
 *
 * None of them are praise. Nothing has been earned yet.
 */
export const authenticationCoachLines: CoachLine[] = [
  {
    coachLineId: 'signInWelcome.letsGetStarted',
    category: 'signInWelcome',
    text: "Right. Sign in and let's see what we're working with.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'signInWelcome.itFollowsYou',
    category: 'signInWelcome',
    text: 'Your training lives in your Google account, so it follows you to whatever phone you pick up.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'signInWelcome.nobodyElseSeesIt',
    category: 'signInWelcome',
    text: "Nobody else sees any of this. It's yours, and it stays that way.",
    minimumVerbosity: 'detailed',
    isPraise: false,
  },
];
