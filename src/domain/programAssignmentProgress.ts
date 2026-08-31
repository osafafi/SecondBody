import type { ProgramTemplate } from '@/types/programTypes';
import type { ProgramAssignment } from '@/types/trainingHistoryTypes';
import type { SessionLetter } from '@/types/trainingVocabulary';

import type { LayoffAdjustment } from './layoffRecovery';
import {
  determineNextSessionLetter,
  findFirstWeekNumberOfPhase,
  findPhaseForWeekNumber,
} from './programPhases';

/**
 * Where the programme is, and where it goes next.
 *
 * The assignment document holds three numbers — phase, week, next letter — and
 * something has to move them. Doing it here rather than in the session screen
 * keeps "the week rolls over after session C" a tested rule instead of an `if`
 * next to a Firestore call.
 */

export type SessionStartPosition = {
  weekNumber: number;
  sessionLetter: SessionLetter;
  phaseNumber: number;

  /**
   * True when a layoff sent the programme back to the first week of its phase.
   * The caller writes the week back to the assignment, so the restart happens
   * once rather than every session until ten more days pass.
   */
  didRestartPhase: boolean;
};

/**
 * Which session is about to be performed.
 *
 * Normally this is simply what the assignment says. After ten days or more away
 * the current phase begins again from its first week, per the safety rail in
 * docs/TRAINING_PROGRAM.md section 12 — the load multiplier that comes with it
 * is applied separately, by `resolveSessionPlan`.
 */
export function resolveSessionStartPosition(
  assignment: ProgramAssignment,
  programTemplate: ProgramTemplate,
  layoffAdjustment: LayoffAdjustment,
): SessionStartPosition {
  const currentPhase = findPhaseForWeekNumber(programTemplate, assignment.currentWeekNumber);
  const firstWeekOfPhase = currentPhase ? findFirstWeekNumberOfPhase(currentPhase) : null;

  const shouldRestart =
    layoffAdjustment.shouldRestartCurrentPhase &&
    firstWeekOfPhase !== null &&
    firstWeekOfPhase < assignment.currentWeekNumber;

  const weekNumber =
    shouldRestart && firstWeekOfPhase !== null ? firstWeekOfPhase : assignment.currentWeekNumber;

  return {
    weekNumber,
    sessionLetter: assignment.nextSessionLetter,
    phaseNumber: currentPhase?.phaseNumber ?? assignment.currentPhaseNumber,
    didRestartPhase: shouldRestart,
  };
}

export type ProgramAssignmentAdvanceInput = {
  assignment: ProgramAssignment;
  programTemplate: ProgramTemplate;

  /** The letter that was just finished, which is not always what the assignment held. */
  completedSessionLetter: SessionLetter;

  /** The week that was just trained. */
  completedWeekNumber: number;

  /** ISO date, `YYYY-MM-DD`. Passed in because `src/domain/` reads no clock. */
  completedOn: string;
};

/**
 * The assignment after a session is finished.
 *
 * The week rolls over after session C and not before, because the cycle is A, B,
 * C rather than one-session-per-weekday: a missed Wednesday is picked up on
 * Friday rather than skipped, so a week is over when its third session is done.
 *
 * Returns the whole assignment rather than a patch, so that a caller cannot
 * write half of a move and leave the phase disagreeing with the week.
 */
export function advanceProgramAssignmentAfterSession(
  input: ProgramAssignmentAdvanceInput,
): ProgramAssignment {
  const { assignment, programTemplate, completedSessionLetter, completedWeekNumber } = input;

  const nextSessionLetter = determineNextSessionLetter(completedSessionLetter);
  const hasFinishedTheWeek = completedSessionLetter === 'C';
  const nextWeekNumber = hasFinishedTheWeek ? completedWeekNumber + 1 : completedWeekNumber;

  const hasFinishedTheProgramme = nextWeekNumber > programTemplate.totalWeekCount;

  if (hasFinishedTheProgramme) {
    return {
      ...assignment,
      currentWeekNumber: programTemplate.totalWeekCount,
      nextSessionLetter,
      status: 'completed',
      completedOn: input.completedOn,
    };
  }

  const nextPhase = findPhaseForWeekNumber(programTemplate, nextWeekNumber);

  return {
    ...assignment,
    currentPhaseNumber: nextPhase?.phaseNumber ?? assignment.currentPhaseNumber,
    currentWeekNumber: nextWeekNumber,
    nextSessionLetter,
    status: 'active',
    completedOn: null,
  };
}

/**
 * The assignment a brand new account starts on.
 *
 * Week 1, session A, phase 1 — the calibration week, where there are no
 * prescriptions yet and the app asks him to find his starting line.
 */
export function createStartingProgramAssignment(
  programTemplate: ProgramTemplate,
  startedOn: string,
): ProgramAssignment {
  const firstPhase = programTemplate.phases[0];

  return {
    programTemplateId: programTemplate.programTemplateId,
    startedOn,
    currentPhaseNumber: firstPhase?.phaseNumber ?? 1,
    currentWeekNumber: 1,
    nextSessionLetter: 'A',
    status: 'active',
    completedOn: null,
  };
}
