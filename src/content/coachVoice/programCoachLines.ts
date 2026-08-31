import type { CoachLine } from '@/types/coachVoiceTypes';

/**
 * What Harout says about the programme rather than about a single set: phases
 * starting, the deload, missed sessions, coming back after a gap, and the one
 * that matters most — the scale not moving in the first three weeks.
 *
 * A missed session is a fact to work around, never a moral event. None of the
 * lines below scold, and none of them are marked as praise.
 */
export const programCoachLines: CoachLine[] = [
  // ---------------------------------------------------------------------------
  // A phase begins
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'phaseOpening.newBlock',
    category: 'phaseOpening',
    text: 'New phase. A few things change — read the session before you start it.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'phaseOpening.youBuiltThis',
    category: 'phaseOpening',
    text: 'Everything that gets harder from here is only possible because of the boring weeks behind it.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'phaseOpening.firstSessionCarefully',
    category: 'phaseOpening',
    text: 'Take the first session of a new movement carefully. Learn it light, then load it.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // Deload week
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'deloadWeekOpening.itIsMeantToFeelEasy',
    category: 'deloadWeekOpening',
    text: "Deload week. Two sets, everything twenty percent lighter. It's supposed to feel like nothing.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'deloadWeekOpening.doNotSkipIt',
    category: 'deloadWeekOpening',
    text: "This will feel like a wasted week. It isn't. It's where the fatigue clears and your joints catch up with your muscles.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'deloadWeekOpening.resistTheUrge',
    category: 'deloadWeekOpening',
    text: "You'll want to add weight because it feels too easy. Don't. That urge is exactly what the week is protecting you from.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // The scale, weeks 1-3
  //
  // docs/TRAINING_PROGRAM.md section 11: this is the single most common reason
  // beginners quit in week three, so the app surfaces it before it is asked.
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'earlyScaleReassurance.itMayGoUp',
    category: 'earlyScaleReassurance',
    text: "Heads up: the scale will barely move for the next couple of weeks, and it might go up. That's water and glycogen moving into muscle. It's a good sign in a bad disguise.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'earlyScaleReassurance.watchTheseInstead',
    category: 'earlyScaleReassurance',
    text: 'Watch the weights going up and how the stairs feel. Those two tell you the truth long before the scale does.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'earlyScaleReassurance.notWeightLoss',
    category: 'earlyScaleReassurance',
    text: "Remember what we're actually doing here. You're not trying to be lighter, you're trying to be a different shape at roughly the same weight.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'earlyScaleReassurance.rateOfLoss',
    category: 'earlyScaleReassurance',
    text: 'Once it does start moving, four to five hundred grams a week is the target. Faster than that and muscle goes with it.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // A session was missed
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'sessionMissed.moveOn',
    category: 'sessionMissed',
    text: 'Missed one. Fine — we pick up at the same session, not further along.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'sessionMissed.noMakeUp',
    category: 'sessionMissed',
    text: "Don't try to make it up by doing two in a row. Forty-eight hours between sessions, always.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'sessionMissed.twelveWeeksIsLong',
    category: 'sessionMissed',
    text: 'One session out of thirty-six changes nothing. Ten of them would. That is the whole difference.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // Coming back after ten days or more
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'returningFromLayoff.startOfThePhase',
    category: 'returningFromLayoff',
    text: "Been a while. We're restarting this phase at eighty percent — not where you left off.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'returningFromLayoff.itComesBackFast',
    category: 'returningFromLayoff',
    text: "It comes back much faster than it went. Two weeks and you'll be past your old numbers.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'returningFromLayoff.noExplanationNeeded',
    category: 'returningFromLayoff',
    text: "I'm not asking where you were. You're here now, that's the whole conversation.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },
];
