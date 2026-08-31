import type { ProgramTemplate } from '@/types/programTypes';
import type { ProgramAssignment } from '@/types/trainingHistoryTypes';
import type { SessionLetter } from '@/types/trainingVocabulary';

import {
  findFirstWeekNumberOfPhase,
  findPhaseForWeekNumber,
  findProgramWeek,
} from './programPhases';

/**
 * Where the twelve weeks have got to.
 *
 * Both M6 screens ask this and neither should work it out for itself: "week 6 of
 * 12" on the Today screen and "week 6 of 12" on the Schedule screen disagreeing
 * would be a small bug that reads as a big one.
 *
 * **Everything here is derived from the programme template rather than assumed.**
 * The number of sessions in a week is `sessionTemplates.length` and not the
 * number three, because the content layer already supports other programmes and
 * the roadmap has one on it. A hard-coded three would be right today and wrong
 * on the day the second block is written, which is exactly the kind of wrong
 * that nobody looks for.
 */

export type ProgramProgressSummary = {
  currentWeekNumber: number;
  totalWeekCount: number;

  currentPhaseNumber: number;
  phaseDisplayName: string;

  /** 1-based within the phase, so "week 2 of 4" reads correctly. */
  weekNumberWithinPhase: number;
  weekCountInPhase: number;

  /** Sessions actually finished, all-time, from the stored history. */
  completedSessionCount: number;

  /** Every session in the whole programme, if none is ever missed. */
  totalSessionCount: number;

  /** 0 to 1, by sessions rather than by weeks. Weeks pass whether or not he trains. */
  completedFraction: number;

  isDeloadWeek: boolean;
  isCalibrationWeek: boolean;

  /** The week's own note from the content, when it has one. */
  weekNote: string | null;

  isProgrammeFinished: boolean;
};

/** Every session the whole programme prescribes, summed over its phases. */
export function countTotalProgrammeSessions(programTemplate: ProgramTemplate): number {
  return programTemplate.phases.reduce(
    (runningTotal, phase) => runningTotal + phase.weeks.length * phase.sessionTemplates.length,
    0,
  );
}

export type ProgramProgressSummaryInput = {
  programTemplate: ProgramTemplate;
  assignment: ProgramAssignment;

  /** From `countCompletedSessions`, over the sessions read back. */
  completedSessionCount: number;
};

export function summariseProgramProgress(
  input: ProgramProgressSummaryInput,
): ProgramProgressSummary {
  const { programTemplate, assignment, completedSessionCount } = input;

  const currentPhase = findPhaseForWeekNumber(programTemplate, assignment.currentWeekNumber);
  const currentWeek = findProgramWeek(programTemplate, assignment.currentWeekNumber);

  const firstWeekNumberOfPhase =
    (currentPhase ? findFirstWeekNumberOfPhase(currentPhase) : null) ??
    assignment.currentWeekNumber;

  const totalSessionCount = countTotalProgrammeSessions(programTemplate);

  return {
    currentWeekNumber: assignment.currentWeekNumber,
    totalWeekCount: programTemplate.totalWeekCount,

    currentPhaseNumber: currentPhase?.phaseNumber ?? assignment.currentPhaseNumber,
    phaseDisplayName: currentPhase?.displayName ?? '',

    weekNumberWithinPhase: assignment.currentWeekNumber - firstWeekNumberOfPhase + 1,
    weekCountInPhase: currentPhase?.weeks.length ?? 0,

    completedSessionCount,
    totalSessionCount,

    /*
     * Measured in sessions, not weeks. A week goes by whether or not anything
     * was trained in it, so a progress bar driven by the calendar would fill up
     * on its own during a fortnight off — which is the opposite of what a
     * progress bar is for.
     */
    completedFraction:
      totalSessionCount === 0 ? 0 : Math.min(1, completedSessionCount / totalSessionCount),

    isDeloadWeek: currentWeek?.isDeloadWeek ?? false,
    isCalibrationWeek: currentWeek?.isCalibrationWeek ?? false,
    weekNote: currentWeek?.weekNote ?? null,

    isProgrammeFinished: assignment.status === 'completed',
  };
}

/**
 * True when the session about to be trained is the first one of a new phase.
 *
 * Session A of the phase's first week, and nothing else. It is the moment the
 * `phaseOpening` coach lines were written for, and saying it on the second
 * session of the phase would spend the line on a session that changes nothing.
 */
export function isFirstSessionOfPhase(
  programTemplate: ProgramTemplate,
  weekNumber: number,
  sessionLetter: SessionLetter,
): boolean {
  if (sessionLetter !== 'A') {
    return false;
  }

  const phase = findPhaseForWeekNumber(programTemplate, weekNumber);

  return phase !== null && findFirstWeekNumberOfPhase(phase) === weekNumber;
}
