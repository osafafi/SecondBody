import type { CoachLine } from '@/types/coachVoiceTypes';

/**
 * What Harout says about the daily habits and the at-home mobility routine.
 *
 * Deliberately light-touch. These appear on a screen someone looks at every day,
 * and a line that nags on day one is a line that gets ignored by day five.
 */
export const habitCoachLines: CoachLine[] = [
  // ---------------------------------------------------------------------------
  // The daily checklist
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'habitEncouragement.proteinFirst',
    category: 'habitEncouragement',
    text: 'If you only get one of these right today, make it the protein.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'habitEncouragement.noFoodDiary',
    category: 'habitEncouragement',
    text: 'Four boxes. No weighing, no counting, no app telling you a banana was a mistake.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'habitEncouragement.stepsDoTheWork',
    category: 'habitEncouragement',
    text: 'The steps do more for fat loss right now than the gym does. Boring, but true.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'habitEncouragement.mostDaysIsEnough',
    category: 'habitEncouragement',
    text: 'Most days is enough. Nobody has ever needed a perfect week for this to work.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
  {
    coachLineId: 'habitEncouragement.sleepIsTraining',
    category: 'habitEncouragement',
    text: 'Sleep is where the training actually gets absorbed. Seven hours is a training target, not a lifestyle one.',
    minimumVerbosity: 'detailed',
    isPraise: false,
  },

  // ---------------------------------------------------------------------------
  // The mobility routine
  // ---------------------------------------------------------------------------
  {
    coachLineId: 'mobilityRoutineOpening.tenMinutes',
    category: 'mobilityRoutineOpening',
    text: 'Ten minutes on the mat. This is the bit that actually fixes the stiffness.',
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'mobilityRoutineOpening.restDaysToo',
    category: 'mobilityRoutineOpening',
    text: "Rest days too — especially rest days. The gym supports this, it doesn't replace it.",
    minimumVerbosity: 'minimal',
    isPraise: false,
  },
  {
    coachLineId: 'mobilityRoutineOpening.slowIsThePoint',
    category: 'mobilityRoutineOpening',
    text: 'Slow it down. Rushing a mobility drill turns it into a warm-up for nothing.',
    minimumVerbosity: 'standard',
    isPraise: false,
  },
];
