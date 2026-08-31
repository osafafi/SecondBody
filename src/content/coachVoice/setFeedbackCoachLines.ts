import type { CoachLine } from '@/types/coachVoiceTypes';

/**
 * What Harout says in response to a set, and to the load changing because of it.
 *
 * This is where praise gets spent. A load going up is a real, measurable thing
 * that happened, so it earns a line that means something — which only works
 * because finishing a set does not.
 *
 * The pain lines are careful on purpose. They state what the app is doing about
 * it, they suggest mentioning it to a GP at most once, and they never diagnose.
 */
export const setFeedbackCoachLines: CoachLine[] = [
  // ---------------------------------------------------------------------------
  // The set felt easy
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'setFeltEasy.thatIsThePlan',
    category: 'setFeltEasy',
    text: 'Good. Easy is what Phase 1 is meant to feel like.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'setFeltEasy.bankIt',
    category: 'setFeltEasy',
    text: "Bank it. We'll take that out of the machine next time, not today.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'setFeltEasy.tendonsAreSlower',
    category: 'setFeltEasy',
    text: "Feels too easy, I know. Your tendons adapt slower than your muscles do, and they're the reason week three hurts people.",
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // The set felt just right
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'setFeltJustRight.thatIsTheSpot',
    category: 'setFeltJustRight',
    text: "That's the spot. Same again.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'setFeltJustRight.holdIt',
    category: 'setFeltJustRight',
    text: 'Right where we want it. Rest properly before the next one.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // The set felt brutal
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'setFeltBrutal.tooMuch',
    category: 'setFeltBrutal',
    text: "That's more than we're after. I'll take ten percent off it next time.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'setFeltBrutal.notAFailure',
    category: 'setFeltBrutal',
    text: 'Nothing went wrong — we just found the ceiling a bit early. Backing off is the correct move, not a punishment.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'setFeltBrutal.restLonger',
    category: 'setFeltBrutal',
    text: 'Take an extra thirty seconds before the next set. Rushing rest is how a hard set becomes a bad one.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // Sharp or joint pain
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'sharpPainReported.stopThatOne',
    category: 'sharpPainReported',
    text: 'Stop that exercise for today. Sharp is different from sore, and sharp is a no.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'sharpPainReported.droppingLoad',
    category: 'sharpPainReported',
    text: "Flagged it. Twenty percent comes off that one next session and we'll see how it goes.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'sharpPainReported.worthMentioning',
    category: 'sharpPainReported',
    text: "If that keeps happening in the same spot, it's worth mentioning to your GP. I'm not a doctor and I'm not going to pretend otherwise.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'sharpPainReported.restOfSessionIsFine',
    category: 'sharpPainReported',
    text: 'The rest of the session is still on. One movement being off does not cancel the other five.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // The load went up. This is what praise is for.
  // ---------------------------------------------------------------------------
  {
    // Not praise: a plain statement of what changed, so the app always has
    // something to say here even when praise is not being spent.
    coachLineId: 'loadIncreased.upItGoes',
    category: 'loadIncreased',
    text: 'Weight goes up this session. Same reps, new number.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'loadIncreased.properJump',
    category: 'loadIncreased',
    text: "That's a proper jump. Nice.",
    minimumVerbosity: 'minimal',
    isPraise: true,
  },
  {
    coachLineId: 'loadIncreased.earnedIt',
    category: 'loadIncreased',
    text: 'Up it goes. You earned that one honestly — every set at the top of the range.',
    minimumVerbosity: 'minimal',
    isPraise: true,
  },
  {
    coachLineId: 'loadIncreased.thisIsTheProgress',
    category: 'loadIncreased',
    text: 'This is the number that matters, by the way. Not the scale. This one.',
    minimumVerbosity: 'standard',
    isPraise: true,
  },
  {
    coachLineId: 'loadIncreased.stillControlled',
    category: 'loadIncreased',
    text: 'Heavier now, so the first rep tells you a lot. If the form goes, we go back down. No ego in it.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // The load came down
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'loadReduced.justANumber',
    category: 'loadReduced',
    text: "Lighter today. It's a number on a machine, not a verdict on you.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'loadReduced.backOffToGoForward',
    category: 'loadReduced',
    text: "We back off, we build again, and in three weeks you're past where you were. That's how this always goes.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'loadReduced.sleepAndFood',
    category: 'loadReduced',
    text: 'Worth a thought: bad sleep and light eating show up here first. It is usually not the training.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },
];
