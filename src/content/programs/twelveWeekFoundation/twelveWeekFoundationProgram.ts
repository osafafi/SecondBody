import type { ProgramPhase, ProgramTemplate, ProgramWeek } from '@/types/programTypes';

import { phaseOneSessionTemplates } from './phaseOneSessionTemplates';
import { phaseThreeSessionTemplates } from './phaseThreeSessionTemplates';
import { phaseTwoSessionTemplates } from './phaseTwoSessionTemplates';
import { fullBodyWarmupRoutine } from './warmupRoutine';

/**
 * Weeks 1-4. Two working sets, then three.
 *
 * Connective tissue adapts slower than muscle, which is exactly why
 * enthusiastic beginners get hurt in week three. This block being almost
 * insultingly easy is the design working, not a shortfall in it.
 */
const phaseOneWeeks: ProgramWeek[] = [
  {
    weekNumber: 1,
    workingSetCount: 2,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: true,
    weekNote:
      'This week is for finding your starting line, not testing you. Nothing here should be hard.',
  },
  {
    weekNumber: 2,
    workingSetCount: 2,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote:
      'Same weights as last week unless something felt like nothing. Repetition is the point.',
  },
  {
    weekNumber: 3,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: 'A third set on everything. Expect the sessions to run a little longer from here.',
  },
  {
    weekNumber: 4,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: null,
  },
];

/** Weeks 5-8. Three working sets, and week 8 is the deload. */
const phaseTwoWeeks: ProgramWeek[] = [
  {
    weekNumber: 5,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: 'New phase. A couple of exercises change places and the effort creeps up a notch.',
  },
  {
    weekNumber: 6,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: null,
  },
  {
    weekNumber: 7,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: null,
  },
  {
    weekNumber: 8,
    workingSetCount: 2,
    loadMultiplier: 0.8,
    isDeloadWeek: true,
    isCalibrationWeek: false,
    weekNote:
      'Deload week. Two sets, everything 20% lighter. It will feel like a waste of a week and it is not — this is where the fatigue clears and your joints catch up.',
  },
];

/** Weeks 9-12. Three working sets, heavier, and free weights where they have been earned. */
const phaseThreeWeeks: ProgramWeek[] = [
  {
    weekNumber: 9,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: 'Four movements change this week. Take the first session of each one carefully.',
  },
  {
    weekNumber: 10,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: null,
  },
  {
    weekNumber: 11,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: null,
  },
  {
    weekNumber: 12,
    workingSetCount: 3,
    loadMultiplier: 1,
    isDeloadWeek: false,
    isCalibrationWeek: false,
    weekNote: 'Last week of the block. Worth looking back at what week 1 asked of you.',
  },
];

const programPhases: ProgramPhase[] = [
  {
    phaseNumber: 1,
    displayName: 'Groove the patterns',
    summary:
      'Machines, mostly. A machine holds the path for you, so a first month of training cannot go badly wrong. The goal is turning up and moving well, not progress — progress is a Phase 2 problem.',
    targetEffortRange: {
      minimumRatingOfPerceivedExertion: 5,
      maximumRatingOfPerceivedExertion: 6,
    },
    weeks: phaseOneWeeks,
    sessionTemplates: phaseOneSessionTemplates,
  },
  {
    phaseNumber: 2,
    displayName: 'Add load',
    summary:
      'The patterns are grooved, so now they get heavier. Free weights start taking over the pressing, and week 8 is a deload you are not allowed to skip.',
    targetEffortRange: {
      minimumRatingOfPerceivedExertion: 6,
      maximumRatingOfPerceivedExertion: 7,
    },
    weeks: phaseTwoWeeks,
    sessionTemplates: phaseTwoSessionTemplates,
  },
  {
    phaseNumber: 3,
    displayName: 'Train properly',
    summary:
      'Barbells, a real squat and the rowing machine. This is what the first eight weeks were building the tissue tolerance for. If you want a fourth day, this is the phase where that becomes a reasonable idea — and not before.',
    targetEffortRange: {
      minimumRatingOfPerceivedExertion: 7,
      maximumRatingOfPerceivedExertion: 8,
    },
    weeks: phaseThreeWeeks,
    sessionTemplates: phaseThreeSessionTemplates,
  },
];

/**
 * The programme the app ships with.
 *
 * It is the direct implementation of docs/TRAINING_PROGRAM.md. If the two ever
 * disagree, that document is the source of truth for intent and this file is the
 * source of truth for behaviour — fix whichever one is actually wrong, and never
 * change one silently.
 */
export const twelveWeekFoundationProgram: ProgramTemplate = {
  programTemplateId: 'twelveWeekFoundation',
  displayName: 'Twelve Week Foundation',
  summary:
    'Three full-body sessions a week for twelve weeks, built for a body that has been sitting down for six years. Machines first, free weights when they are earned, and nothing that loads a spine into flexion.',

  totalWeekCount: 12,

  /** Monday, Wednesday, Friday. 0 is Sunday. */
  defaultTrainingDaysOfWeek: [1, 3, 5],

  minimumHoursBetweenSessions: 48,

  warmupRoutine: fullBodyWarmupRoutine,

  phases: programPhases,
};
