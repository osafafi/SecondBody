import type {
  ProgramPhase,
  ProgramTemplate,
  ProgramWeek,
  SessionTemplate,
} from '@/types/programTypes';
import { SESSION_LETTERS, type SessionLetter } from '@/types/trainingVocabulary';

/**
 * Finding your way around a programme template: which phase a week belongs to,
 * what that week asks for, and which session comes next.
 *
 * All lookups, no arithmetic — the programme content states every week
 * explicitly, so there is nothing here to derive and nothing to get subtly
 * wrong.
 */

/** The phase containing a week number, or null when the week is outside the programme. */
export function findPhaseForWeekNumber(
  programTemplate: ProgramTemplate,
  weekNumber: number,
): ProgramPhase | null {
  return (
    programTemplate.phases.find((phase) =>
      phase.weeks.some((week) => week.weekNumber === weekNumber),
    ) ?? null
  );
}

/** One week's set count, load multiplier and notes. Null when there is no such week. */
export function findProgramWeek(
  programTemplate: ProgramTemplate,
  weekNumber: number,
): ProgramWeek | null {
  for (const phase of programTemplate.phases) {
    const week = phase.weeks.find((candidate) => candidate.weekNumber === weekNumber);

    if (week) {
      return week;
    }
  }

  return null;
}

/** One of a phase's three session templates. Null when the phase does not define it. */
export function findSessionTemplate(
  phase: ProgramPhase,
  sessionLetter: SessionLetter,
): SessionTemplate | null {
  return (
    phase.sessionTemplates.find(
      (sessionTemplate) => sessionTemplate.sessionLetter === sessionLetter,
    ) ?? null
  );
}

/**
 * A, B, C, A, B, C.
 *
 * The cycle is not tied to the week or to the weekday: a missed session is
 * picked up where it was left, rather than skipped. Three sessions and three
 * training days does mean each session lands on the same weekday each week for
 * as long as nothing is missed, which is the point.
 */
export function determineNextSessionLetter(previousSessionLetter: SessionLetter): SessionLetter {
  const previousIndex = SESSION_LETTERS.indexOf(previousSessionLetter);
  const nextIndex = (previousIndex + 1) % SESSION_LETTERS.length;
  const nextSessionLetter = SESSION_LETTERS[nextIndex];

  // SESSION_LETTERS is a non-empty const tuple and the index is taken modulo its
  // length, so this cannot be undefined. The check exists to satisfy
  // noUncheckedIndexedAccess without an assertion.
  if (!nextSessionLetter) {
    throw new Error('The session letter cycle is empty, which should be impossible.');
  }

  return nextSessionLetter;
}

/**
 * The week number a phase restarts at. Used when coming back after a long gap:
 * the phase begins again rather than resuming mid-block.
 */
export function findFirstWeekNumberOfPhase(phase: ProgramPhase): number | null {
  const weekNumbers = phase.weeks.map((week) => week.weekNumber);

  return weekNumbers.length === 0 ? null : Math.min(...weekNumbers);
}

/** True once every week of the programme has been completed. */
export function isProgramComplete(
  programTemplate: ProgramTemplate,
  completedWeekCount: number,
): boolean {
  return completedWeekCount >= programTemplate.totalWeekCount;
}
