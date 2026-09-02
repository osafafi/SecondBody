import {
  canSessionReturnToExercise,
  countSetsLoggedAgainstExercise,
  findLoggedExercise,
  type ActiveSessionState,
} from './activeSessionMachine';
import type { PlannedExercise, PlannedSession } from './sessionPlanning';

/**
 * The session, seen all at once.
 *
 * F8, F9 and F10 in docs/FEEDBACK.md are the same complaint from three angles:
 * the session player is a corridor. You cannot look at what is coming without
 * committing to it, you cannot answer a busy machine with anything but a skip,
 * and the only place the whole session is listed is a column of names with no
 * pictures on it.
 *
 * The board is the answer to all three, and this is the part of it that is a
 * rule rather than a layout: what state each movement is in, and whether the
 * session is allowed to go back to it. The grid of cards renders this.
 */

export const SESSION_BOARD_ENTRY_STATUSES = [
  /** Not reached yet. */
  'notStarted',

  /** Some sets are in and more are owed. */
  'inProgress',

  /** Every set is in, or a set of it caused sharp pain and ended it for today. */
  'done',

  /** Decided against, for today. Reversible from the board. */
  'skipped',

  /** Someone is on the machine. Not a decision about the movement. */
  'waitingOnMachine',
] as const;

export type SessionBoardEntryStatus = (typeof SESSION_BOARD_ENTRY_STATUSES)[number];

export type SessionBoardEntry = {
  /** Index into `PlannedSession.exercises`, which is what `exerciseSelected` takes. */
  exerciseIndex: number;

  plannedExercise: PlannedExercise;

  status: SessionBoardEntryStatus;

  /** Sets already logged, for "2 of 3 done" on the card. */
  loggedSetCount: number;

  /** The movement the session is on right now, or heading into after this rest. */
  isCurrent: boolean;

  /**
   * Whether tapping the card can send the session here.
   *
   * False for anything finished — three sets are three sets, and a movement that
   * caused sharp pain is closed for the day. A skipped one is true: a skip is a
   * decision, and walking back over to the machine reverses it.
   */
  canBeReturnedTo: boolean;
};

/**
 * The phases in which the board is a way of moving around rather than only a
 * way of looking.
 *
 * It matches the phases `exerciseSelected` accepts in the machine. Two lists
 * that must agree is one more than ideal, but the alternative is the screen
 * asking the machine "would you take this event", which is worse.
 */
function canChooseFromTheBoardDuring(phase: ActiveSessionState['phase']): boolean {
  return (
    phase === 'exerciseBrief' ||
    phase === 'setInProgress' ||
    phase === 'resting' ||
    phase === 'sessionReview'
  );
}

function resolveEntryStatus(
  plannedExercise: PlannedExercise,
  state: ActiveSessionState,
): SessionBoardEntryStatus {
  /*
   * Finished beats everything else, including parked. A movement that was
   * waiting on a machine and then got done is done, and leaving it labelled as
   * waiting would have him walk back over to it for nothing.
   */
  if (!canSessionReturnToExercise(plannedExercise, state.loggedExercises)) {
    return 'done';
  }

  if (findLoggedExercise(state, plannedExercise.exerciseId)?.wasSkipped === true) {
    return 'skipped';
  }

  if (state.parkedExerciseIds.includes(plannedExercise.exerciseId)) {
    return 'waitingOnMachine';
  }

  return countSetsLoggedAgainstExercise(state.loggedExercises, plannedExercise.exerciseId) > 0
    ? 'inProgress'
    : 'notStarted';
}

/** Every movement in the session, in session order, with where each one stands. */
export function buildSessionBoard(
  state: ActiveSessionState,
  plannedSession: PlannedSession,
): SessionBoardEntry[] {
  const isChoosingAllowed = canChooseFromTheBoardDuring(state.phase);

  return plannedSession.exercises.map((plannedExercise, exerciseIndex) => ({
    exerciseIndex,
    plannedExercise,
    status: resolveEntryStatus(plannedExercise, state),
    loggedSetCount: countSetsLoggedAgainstExercise(
      state.loggedExercises,
      plannedExercise.exerciseId,
    ),
    isCurrent: exerciseIndex === state.currentExerciseIndex && state.phase !== 'completed',
    canBeReturnedTo:
      isChoosingAllowed && canSessionReturnToExercise(plannedExercise, state.loggedExercises),
  }));
}

/** How many movements are still owed work, for the line above the grid. */
export function countSessionBoardEntriesLeft(entries: SessionBoardEntry[]): number {
  return entries.filter((entry) => entry.status !== 'done' && entry.status !== 'skipped').length;
}
