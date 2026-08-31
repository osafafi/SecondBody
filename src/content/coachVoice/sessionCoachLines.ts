import type { CoachLine } from '@/types/coachVoiceTypes';

/**
 * What Harout says around a session: opening it, handing over from the warm-up,
 * explaining week 1, and closing it out.
 *
 * Praise is rationed here on purpose. Finishing a session is the expected
 * outcome, not an achievement, so only a couple of these are marked as praise
 * and the rest simply acknowledge that it happened.
 */
export const sessionCoachLines: CoachLine[] = [
  // ---------------------------------------------------------------------------
  // Opening a session
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'sessionOpening.hereWeGo',
    category: 'sessionOpening',
    text: "Right, let's go. Warm-up first — it's not optional and it's not padding.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'sessionOpening.showedUp',
    category: 'sessionOpening',
    text: "You're here. That's most of it. The rest is just following the list.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'sessionOpening.noHeroics',
    category: 'sessionOpening',
    text: 'No heroics today. Move well, hit the numbers on the screen, go home.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'sessionOpening.fortyFiveMinutes',
    category: 'sessionOpening',
    text: "Forty-five minutes and you're done. That's less time than an episode of anything.",
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // Warm-up finished
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'warmupFinished.warmNow',
    category: 'warmupFinished',
    text: "Good. You're warm. Now the actual work.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'warmupFinished.rampSet',
    category: 'warmupFinished',
    text: 'One light set of the first exercise before you load it properly. Rehearsal, not work.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'warmupFinished.thatWasTraining',
    category: 'warmupFinished',
    text: "That warm-up is where your mobility actually improves, by the way. It's training, not a formality.",
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // Week 1 calibration
  //
  // The first line is quoted verbatim from docs/TRAINING_PROGRAM.md section 7.
  // If you rewrite it, rewrite it there too.
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'calibrationInstruction.findTheStartingLine',
    category: 'calibrationInstruction',
    text: "Pick a weight you think you could do about 15 reps with. Then stop at 12. If 12 felt like nothing, go up next set. We're finding your starting line, not testing you.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'calibrationInstruction.noWrongAnswer',
    category: 'calibrationInstruction',
    text: "There's no wrong number this week. Whatever you land on becomes the thing we build from.",
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'calibrationInstruction.startTooLight',
    category: 'calibrationInstruction',
    text: 'If you are going to get it wrong, get it wrong on the light side. We can add weight next week. We cannot un-tweak a back.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // Session completed
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'sessionCompleted.done',
    category: 'sessionCompleted',
    text: 'Done. Go eat something with protein in it.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'sessionCompleted.logged',
    category: 'sessionCompleted',
    text: "That's logged. Next one is in the calendar — at least a day off in between, always.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'sessionCompleted.thatIsHowItAddsUp',
    category: 'sessionCompleted',
    text: 'Three of those a week is the whole plan. Nothing clever, just that.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'sessionCompleted.solidWork',
    category: 'sessionCompleted',
    text: 'That was a proper session. Genuinely good work today.',
    minimumVerbosity: 'standard',
    isPraise: true,
  },
];
