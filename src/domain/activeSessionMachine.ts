import type {
  OverallSessionFeeling,
  PerformedExercise,
  PerformedSet,
} from '@/types/trainingHistoryTypes';

import { measureRestSecondsTaken } from './restTimer';
import type { PlannedExercise, PlannedSession } from './sessionPlanning';

/**
 * The session player, as a state machine.
 *
 * This is the piece docs/ARCHITECTURE.md section 6 calls the only genuinely
 * complex state in the app. Modelling it as an explicit machine rather than a
 * pile of booleans is what stops the "am I resting or am I mid-set?" class of
 * bug, which would be very annoying with a phone in one hand and a dumbbell in
 * the other.
 *
 * Everything here is pure. The store in `src/features/activeSession/` owns the
 * clock, the Firestore writes and the wake lock; this owns what may follow what.
 */

/**
 * Where the session currently is.
 *
 * These are the states drawn in docs/ARCHITECTURE.md section 6, with three
 * renamed: `setActive` and `setLogging` read as adjectives rather than as
 * states, and `cooldown` described a stretch that this step is not — it asks how
 * the session felt. The diagram in that document has been updated to match.
 */
export const ACTIVE_SESSION_PHASES = [
  /** The mobility drills and the ramp set, before anything is loaded. */
  'warmingUp',

  /** The next exercise, its animation and its cues, before its first set. */
  'exerciseBrief',

  /** A set is under way. The screen shows the weight and the target reps. */
  'setInProgress',

  /** The set is finished and is being recorded: reps, weight, effort, pain. */
  'loggingSet',

  /** The rest timer between two sets. */
  'resting',

  /** Every exercise is done. How did that feel, and anything worth noting. */
  'sessionReview',

  /** Saved. The read-out of what was just done. */
  'completed',
] as const;

export type ActiveSessionPhase = (typeof ACTIVE_SESSION_PHASES)[number];

export type ActiveSessionState = {
  phase: ActiveSessionPhase;

  /**
   * Index into `PlannedSession.exercises`. Equal to the exercise count once
   * every exercise has been logged or skipped.
   */
  currentExerciseIndex: number;

  /** 1-based within the current exercise. Always 1 when an exercise is entered. */
  currentSetNumber: number;

  /**
   * What has been logged so far, in the shape the session document stores.
   * Written to Firestore after every set, so an interrupted session resumes.
   */
  loggedExercises: PerformedExercise[];

  /** When the current rest began. Null in every phase but `resting`. */
  restStartedAt: Date | null;

  /** How long the current rest is meant to be. */
  restTargetSeconds: number;

  /**
   * How long the rest before the set about to be performed actually lasted.
   *
   * Recorded when the rest ends rather than when the set is logged, because by
   * then the rest is over and the elapsed time has gone. Null before the first
   * set of an exercise, which has no rest in front of it to measure.
   */
  restSecondsBeforeCurrentSet: number | null;

  /**
   * True when the rest now running ends at a different movement's brief rather
   * than at the next set of the one just performed.
   *
   * The set number used to answer this — "set 1 can only mean a new exercise",
   * because a set number never resets within an exercise. That stopped being
   * true the moment an exercise could be parked half-finished and come back at
   * set 3, so the rest now says where it leads instead of it being inferred.
   */
  doesRestLeadToANewExercise: boolean;

  /**
   * Exercises put aside because someone was on the machine, in the order they
   * were parked.
   *
   * **Parking is not skipping.** A skip is a decision about the movement — it is
   * not being trained today — and it is stored on the session document. This is
   * a decision about the queue: someone is on it, come back to it. So it lives
   * here and is deliberately *not* persisted. A session resumed an hour later
   * should not still believe a machine is occupied.
   *
   * It becomes a skip, with a reason, only if the session is closed off without
   * ever coming back to it.
   */
  parkedExerciseIds: string[];

  overallFeeling: OverallSessionFeeling | null;
  sessionNotes: string | null;
};

export type ActiveSessionEvent =
  /** The warm-up drills and the ramp set are done. */
  | { kind: 'warmupFinished' }

  /** The brief has been read and the first set of this exercise starts now. */
  | { kind: 'exerciseStarted' }

  /** The set has been performed. Move on to recording it. */
  | { kind: 'setFinished' }

  /** What actually happened on the set. */
  | { kind: 'setLogged'; performedSet: PerformedSet; occurredAt: Date }

  /** Not ready yet. Adds to the rest that was prescribed. */
  | { kind: 'restExtended'; extraSeconds: number }

  /** The rest timer ran out, or was skipped. Both mean the same thing here. */
  | { kind: 'restFinished'; occurredAt: Date }

  /** The machine was busy, it hurt, or there was no time. The reason is optional. */
  | { kind: 'exerciseSkipped'; skipReason: string | null }

  /**
   * Someone is on the machine. Put this one aside, get on with the session, and
   * offer it again at the end.
   */
  | { kind: 'exerciseParked' }

  /**
   * Chosen from the session board rather than arrived at in order. The session
   * moves to that movement's brief, un-parking and un-skipping it on the way.
   */
  | { kind: 'exerciseSelected'; exerciseIndex: number }

  /**
   * Out of time, cutting it short. Everything done so far still counts and the
   * session still finishes properly — four exercises out of six is a session,
   * not a failure, and it should be recorded as one.
   */
  | { kind: 'sessionEndedEarly' }
  | { kind: 'overallFeelingChosen'; overallFeeling: OverallSessionFeeling }
  | { kind: 'sessionNotesEdited'; sessionNotes: string }

  /** The review is filled in and the session is being saved. */
  | { kind: 'sessionFinished' };

/** A session that has been opened but has not started moving yet. */
export function createInitialActiveSessionState(): ActiveSessionState {
  return {
    phase: 'warmingUp',
    currentExerciseIndex: 0,
    currentSetNumber: 1,
    loggedExercises: [],
    restStartedAt: null,
    restTargetSeconds: 0,
    restSecondsBeforeCurrentSet: null,
    doesRestLeadToANewExercise: false,
    parkedExerciseIds: [],
    overallFeeling: null,
    sessionNotes: null,
  };
}

/** The exercise the session is currently on, or null once they are all done. */
export function findCurrentPlannedExercise(
  state: ActiveSessionState,
  plannedSession: PlannedSession,
): PlannedExercise | null {
  return plannedSession.exercises[state.currentExerciseIndex] ?? null;
}

/** What has been logged against one exercise so far, if it has been reached. */
export function findLoggedExercise(
  state: ActiveSessionState,
  exerciseId: string,
): PerformedExercise | null {
  return (
    state.loggedExercises.find((loggedExercise) => loggedExercise.exerciseId === exerciseId) ?? null
  );
}

/** How many sets of one movement are already in the log. */
export function countSetsLoggedAgainstExercise(
  loggedExercises: PerformedExercise[],
  exerciseId: string,
): number {
  return (
    loggedExercises.find((loggedExercise) => loggedExercise.exerciseId === exerciseId)
      ?.performedSets.length ?? 0
  );
}

/**
 * Whether the session is still allowed to put this movement in front of him.
 *
 * Two things close an exercise for the day and neither can be undone from the
 * board: its sets are all in, or a set of it caused sharp pain. Being *skipped*
 * is not one of them — a skip is a decision, and a decision made by mistake, or
 * made because a machine was busy, should be reversible while the session is
 * still running.
 */
export function canSessionReturnToExercise(
  plannedExercise: PlannedExercise,
  loggedExercises: PerformedExercise[],
): boolean {
  const loggedExercise = loggedExercises.find(
    (candidate) => candidate.exerciseId === plannedExercise.exerciseId,
  );

  if (!loggedExercise) {
    return true;
  }

  /*
   * A set that caused sharp pain ends that exercise for the day, so an exercise
   * short of its set count is only owed more work when the last set logged
   * against it was pain-free.
   */
  if (loggedExercise.performedSets.at(-1)?.didCauseSharpPain === true) {
    return false;
  }

  return loggedExercise.performedSets.length < plannedExercise.workingSetCount;
}

/**
 * Whether an exercise still owes work, left to itself.
 *
 * One rule, three callers: what the session offers next, where an interrupted
 * session picks up, and what the board draws on each card. A skipped movement
 * owes nothing — it can still be returned to deliberately, which is what
 * `canSessionReturnToExercise` answers, but nothing will steer him back to it.
 */
export function isPlannedExerciseStillOwed(
  plannedExercise: PlannedExercise,
  loggedExercises: PerformedExercise[],
): boolean {
  const loggedExercise = loggedExercises.find(
    (candidate) => candidate.exerciseId === plannedExercise.exerciseId,
  );

  if (loggedExercise?.wasSkipped === true) {
    return false;
  }

  return canSessionReturnToExercise(plannedExercise, loggedExercises);
}

/**
 * Which exercise the session should put in front of him next, or null when
 * there is nothing left and the session is over.
 *
 * Session order, first thing still owed — and parked movements come last.
 * "Someone is on the leg extension" means get on with the rest of the session
 * and try it again at the end, by which time it is usually free. That last part
 * is F9 in docs/FEEDBACK.md, and it is why this is a search rather than
 * `currentExerciseIndex + 1`.
 *
 * `mayOfferParked` is false in exactly one place: the moment something is
 * parked. Handing it straight back would be a loop, and would also be rude.
 */
function findNextExerciseIndexToOffer(
  plannedSession: PlannedSession,
  loggedExercises: PerformedExercise[],
  parkedExerciseIds: string[],
  mayOfferParked: boolean,
): number | null {
  const isStillOwed = (plannedExercise: PlannedExercise): boolean =>
    isPlannedExerciseStillOwed(plannedExercise, loggedExercises);

  const unparkedIndex = plannedSession.exercises.findIndex(
    (plannedExercise) =>
      isStillOwed(plannedExercise) && !parkedExerciseIds.includes(plannedExercise.exerciseId),
  );

  if (unparkedIndex >= 0) {
    return unparkedIndex;
  }

  if (!mayOfferParked) {
    return null;
  }

  const parkedIndex = plannedSession.exercises.findIndex(isStillOwed);

  return parkedIndex >= 0 ? parkedIndex : null;
}

/**
 * The log entry for one planned exercise, created on first use.
 *
 * Entries appear as exercises are reached rather than all at once, so a session
 * that was abandoned halfway records the exercises actually met instead of a
 * list of empty ones that read as skipped.
 */
function findOrCreateLogEntry(
  loggedExercises: PerformedExercise[],
  plannedExercise: PlannedExercise,
): PerformedExercise[] {
  const hasEntryAlready = loggedExercises.some(
    (loggedExercise) => loggedExercise.exerciseId === plannedExercise.exerciseId,
  );

  if (hasEntryAlready) {
    return loggedExercises;
  }

  return [
    ...loggedExercises,
    {
      exerciseId: plannedExercise.exerciseId,
      orderIndex: plannedExercise.orderIndex,
      performedSets: [],
      wasSkipped: false,
      skipReason: null,
    },
  ];
}

function updateLogEntry(
  loggedExercises: PerformedExercise[],
  exerciseId: string,
  applyChange: (entry: PerformedExercise) => PerformedExercise,
): PerformedExercise[] {
  return loggedExercises.map((loggedExercise) =>
    loggedExercise.exerciseId === exerciseId ? applyChange(loggedExercise) : loggedExercise,
  );
}

/**
 * Leaves the current exercise behind and points at whatever is owed next.
 *
 * The phase becomes `sessionReview` once nothing is owed, which is the only way
 * a session finishes — running out of work, rather than a separate "am I done
 * yet" check somewhere in the UI.
 *
 * The set number is read back out of the log rather than reset to 1, because
 * what is offered next may be a movement that was parked halfway through and is
 * owed its third set, not its first.
 */
function moveToNextExercise(
  state: ActiveSessionState,
  plannedSession: PlannedSession,
  loggedExercises: PerformedExercise[],
  parkedExerciseIds: string[],
  mayOfferParked: boolean,
): ActiveSessionState {
  const nextExerciseIndex = findNextExerciseIndexToOffer(
    plannedSession,
    loggedExercises,
    parkedExerciseIds,
    mayOfferParked,
  );

  const nextExercise =
    nextExerciseIndex === null ? null : plannedSession.exercises[nextExerciseIndex];

  return {
    ...state,
    phase: nextExercise ? 'exerciseBrief' : 'sessionReview',
    currentExerciseIndex: nextExerciseIndex ?? plannedSession.exercises.length,
    currentSetNumber: nextExercise
      ? countSetsLoggedAgainstExercise(loggedExercises, nextExercise.exerciseId) + 1
      : 1,
    loggedExercises,
    parkedExerciseIds,
    restStartedAt: null,
    restTargetSeconds: 0,
    restSecondsBeforeCurrentSet: null,
    doesRestLeadToANewExercise: false,
  };
}

/**
 * What a logged set means for where the session goes next.
 *
 * Three outcomes, in priority order:
 *
 * 1. **The set caused sharp pain.** That exercise is over for today — the coach
 *    says exactly that in `src/content/coachVoice/`, and the progression rules
 *    already take 20% off it next time. Sharp is different from sore, and
 *    loading a joint that has just complained is the one thing this app must
 *    not do.
 * 2. **There are sets left.** Rest, then the next set.
 * 3. **That was the last set.** Rest, then the next exercise — or the review,
 *    when there is no next exercise.
 */
function applyLoggedSet(
  state: ActiveSessionState,
  plannedSession: PlannedSession,
  performedSet: PerformedSet,
  occurredAt: Date,
): ActiveSessionState {
  const plannedExercise = findCurrentPlannedExercise(state, plannedSession);

  if (!plannedExercise) {
    return state;
  }

  const loggedExercises = updateLogEntry(
    findOrCreateLogEntry(state.loggedExercises, plannedExercise),
    plannedExercise.exerciseId,
    (entry) => ({ ...entry, performedSets: [...entry.performedSets, performedSet] }),
  );

  const hasAnotherSet =
    !performedSet.didCauseSharpPain && state.currentSetNumber < plannedExercise.workingSetCount;

  /*
   * Rest happens between two sets of one exercise AND between two exercises.
   * Walking straight from a set of squats into the brief for the next movement
   * is how a session turns into a circuit, which is not what this programme is.
   */
  const restStarting = {
    phase: 'resting' as const,
    loggedExercises,
    restStartedAt: occurredAt,
    restTargetSeconds: plannedExercise.restSecondsBetweenSets,
    // The rest that has just begun belongs to the set that follows it.
    restSecondsBeforeCurrentSet: null,
  };

  if (hasAnotherSet) {
    return {
      ...state,
      ...restStarting,
      currentSetNumber: state.currentSetNumber + 1,
      doesRestLeadToANewExercise: false,
    };
  }

  const nextExerciseIndex = findNextExerciseIndexToOffer(
    plannedSession,
    loggedExercises,
    state.parkedExerciseIds,
    true,
  );

  const nextExercise =
    nextExerciseIndex === null ? null : plannedSession.exercises[nextExerciseIndex];

  // Nothing left to rest for. The session goes straight to its review.
  if (nextExerciseIndex === null || !nextExercise) {
    return moveToNextExercise(
      state,
      plannedSession,
      loggedExercises,
      state.parkedExerciseIds,
      true,
    );
  }

  return {
    ...state,
    ...restStarting,
    currentExerciseIndex: nextExerciseIndex,
    currentSetNumber: countSetsLoggedAgainstExercise(loggedExercises, nextExercise.exerciseId) + 1,
    doesRestLeadToANewExercise: true,
  };
}

function applySkippedExercise(
  state: ActiveSessionState,
  plannedSession: PlannedSession,
  skipReason: string | null,
): ActiveSessionState {
  const plannedExercise = findCurrentPlannedExercise(state, plannedSession);

  if (!plannedExercise) {
    return state;
  }

  const loggedExercises = updateLogEntry(
    findOrCreateLogEntry(state.loggedExercises, plannedExercise),
    plannedExercise.exerciseId,
    (entry) => ({ ...entry, wasSkipped: true, skipReason }),
  );

  /*
   * A skipped movement leaves the parked list. Parking says "not yet" and
   * skipping says "not today"; the second answer replaces the first, and
   * leaving it parked would have it counted twice at the end of the session.
   */
  return moveToNextExercise(
    state,
    plannedSession,
    loggedExercises,
    state.parkedExerciseIds.filter(
      (parkedExerciseId) => parkedExerciseId !== plannedExercise.exerciseId,
    ),
    true,
  );
}

/**
 * Someone is on the machine.
 *
 * Nothing is written to the log — nothing happened — so this does not touch
 * Firestore. It moves the session on and remembers to come back.
 *
 * Parked movements are not offered again straight away, which is what stops
 * parking the last remaining exercise from handing it back and looping. When
 * there is genuinely nothing else left, the session goes to its review and the
 * board is still there to send him back if the machine frees up.
 */
function applyParkedExercise(
  state: ActiveSessionState,
  plannedSession: PlannedSession,
): ActiveSessionState {
  const plannedExercise = findCurrentPlannedExercise(state, plannedSession);

  if (!plannedExercise) {
    return state;
  }

  const parkedExerciseIds = state.parkedExerciseIds.includes(plannedExercise.exerciseId)
    ? state.parkedExerciseIds
    : [...state.parkedExerciseIds, plannedExercise.exerciseId];

  return moveToNextExercise(state, plannedSession, state.loggedExercises, parkedExerciseIds, false);
}

/**
 * The reason stored against an exercise parked and never returned to.
 *
 * A plain sentence rather than a code, because `skipReason` is free text that is
 * read by a person and by the coaching bundle, and "machineBusy" would have to
 * be translated back into English by both.
 */
const MACHINE_BUSY_SKIP_REASON = 'The machine was busy and never freed up.';

/**
 * Parked exercises that were never come back to, written down as skips.
 *
 * A parked movement means "not yet" for as long as the session is running. The
 * moment the session is closed off, "not yet" has become "not today", and the
 * record should say why — which is the whole of F9 in docs/FEEDBACK.md. Before
 * it, the only thing the session could record about a busy machine was a skip
 * with no reason at all.
 *
 * An exercise that was parked but has sets against it keeps them. It is stored
 * as skipped from the point it was parked, which is what happened.
 */
function recordUnvisitedParkedExercisesAsSkipped(
  state: ActiveSessionState,
  plannedSession: PlannedSession,
): PerformedExercise[] {
  return state.parkedExerciseIds.reduce<PerformedExercise[]>((loggedExercises, parkedId) => {
    const plannedExercise = plannedSession.exercises.find(
      (candidate) => candidate.exerciseId === parkedId,
    );

    if (!plannedExercise || !isPlannedExerciseStillOwed(plannedExercise, loggedExercises)) {
      return loggedExercises;
    }

    return updateLogEntry(
      findOrCreateLogEntry(loggedExercises, plannedExercise),
      parkedId,
      (entry) => ({ ...entry, wasSkipped: true, skipReason: MACHINE_BUSY_SKIP_REASON }),
    );
  }, state.loggedExercises);
}

/**
 * The whole machine.
 *
 * An event that does not belong to the current phase returns the state
 * unchanged rather than throwing. A double tap on a button in a gym is a fact of
 * life, not an exception.
 */
export function applyActiveSessionEvent(
  state: ActiveSessionState,
  event: ActiveSessionEvent,
  plannedSession: PlannedSession,
): ActiveSessionState {
  switch (event.kind) {
    case 'warmupFinished': {
      if (state.phase !== 'warmingUp') {
        return state;
      }

      /*
       * A plan with no exercises in it is not a real session, but the machine
       * should still terminate rather than point at an exercise that is not
       * there.
       */
      return {
        ...state,
        phase: plannedSession.exercises.length === 0 ? 'sessionReview' : 'exerciseBrief',
      };
    }

    case 'exerciseStarted': {
      if (state.phase !== 'exerciseBrief') {
        return state;
      }

      const plannedExercise = findCurrentPlannedExercise(state, plannedSession);

      if (!plannedExercise) {
        return state;
      }

      return {
        ...state,
        phase: 'setInProgress',
        loggedExercises: findOrCreateLogEntry(state.loggedExercises, plannedExercise),
      };
    }

    case 'setFinished': {
      return state.phase === 'setInProgress' ? { ...state, phase: 'loggingSet' } : state;
    }

    case 'setLogged': {
      if (state.phase !== 'loggingSet') {
        return state;
      }

      return applyLoggedSet(state, plannedSession, event.performedSet, event.occurredAt);
    }

    case 'restExtended': {
      if (state.phase !== 'resting') {
        return state;
      }

      /*
       * The target moves rather than the start, so the elapsed time on screen
       * keeps counting from when the rest actually began. Resetting the start
       * would make a 30 second extension look like a fresh 90.
       */
      return { ...state, restTargetSeconds: state.restTargetSeconds + event.extraSeconds };
    }

    case 'restFinished': {
      if (state.phase !== 'resting') {
        return state;
      }

      /*
       * A rest between two exercises ends at the new movement's brief; a rest
       * between two sets of one exercise leads straight back into the next set.
       * Which of the two this was is recorded when the rest starts rather than
       * inferred from the set number here — see `doesRestLeadToANewExercise`.
       */
      return {
        ...state,
        phase: state.doesRestLeadToANewExercise ? 'exerciseBrief' : 'setInProgress',
        restStartedAt: null,
        restSecondsBeforeCurrentSet: measureRestSecondsTaken(state.restStartedAt, event.occurredAt),
      };
    }

    case 'exerciseSkipped': {
      const isInsideAnExercise =
        state.phase === 'exerciseBrief' ||
        state.phase === 'setInProgress' ||
        state.phase === 'loggingSet';

      if (!isInsideAnExercise) {
        return state;
      }

      return applySkippedExercise(state, plannedSession, event.skipReason);
    }

    case 'exerciseParked': {
      /*
       * Not from `loggingSet`. A set has been performed and is halfway through
       * being written down; the machine is not the thing in the way any more.
       */
      const isInsideAnExercise = state.phase === 'exerciseBrief' || state.phase === 'setInProgress';

      if (!isInsideAnExercise) {
        return state;
      }

      return applyParkedExercise(state, plannedSession);
    }

    case 'exerciseSelected': {
      /*
       * Allowed from the review as well as from inside the session, which is how
       * a machine that frees up at the very end still gets used. Not allowed
       * from the warm-up — the warm-up is training, not a menu — and not from
       * `loggingSet`, where a set is midway through being recorded.
       */
      const canChooseAnExercise =
        state.phase === 'exerciseBrief' ||
        state.phase === 'setInProgress' ||
        state.phase === 'resting' ||
        state.phase === 'sessionReview';

      if (!canChooseAnExercise) {
        return state;
      }

      const chosenExercise = plannedSession.exercises[event.exerciseIndex];

      if (!chosenExercise || !canSessionReturnToExercise(chosenExercise, state.loggedExercises)) {
        return state;
      }

      /*
       * Choosing a movement undoes both of the reasons it might have been set
       * aside. It is no longer waiting on a machine, and a skip decided earlier
       * is being reversed by the act of walking back over to it.
       */
      return {
        ...state,
        phase: 'exerciseBrief',
        currentExerciseIndex: event.exerciseIndex,
        currentSetNumber:
          countSetsLoggedAgainstExercise(state.loggedExercises, chosenExercise.exerciseId) + 1,
        loggedExercises: updateLogEntry(
          state.loggedExercises,
          chosenExercise.exerciseId,
          (entry) => ({
            ...entry,
            wasSkipped: false,
            skipReason: null,
          }),
        ),
        parkedExerciseIds: state.parkedExerciseIds.filter(
          (parkedExerciseId) => parkedExerciseId !== chosenExercise.exerciseId,
        ),
        restStartedAt: null,
        restTargetSeconds: 0,
        restSecondsBeforeCurrentSet: null,
        doesRestLeadToANewExercise: false,
      };
    }

    case 'sessionEndedEarly': {
      if (state.phase === 'sessionReview' || state.phase === 'completed') {
        return state;
      }

      /*
       * The exercises never reached are simply absent from the log, which reads
       * as "not got to" rather than as "skipped". Skipping is a decision about
       * one movement; this is running out of time.
       */
      return {
        ...state,
        phase: 'sessionReview',
        currentExerciseIndex: plannedSession.exercises.length,
        restStartedAt: null,
        restTargetSeconds: 0,
        restSecondsBeforeCurrentSet: null,
        doesRestLeadToANewExercise: false,
      };
    }

    case 'overallFeelingChosen': {
      return state.phase === 'sessionReview'
        ? { ...state, overallFeeling: event.overallFeeling }
        : state;
    }

    case 'sessionNotesEdited': {
      if (state.phase !== 'sessionReview') {
        return state;
      }

      const trimmedNotes = event.sessionNotes.trim();

      return { ...state, sessionNotes: trimmedNotes.length === 0 ? null : trimmedNotes };
    }

    case 'sessionFinished': {
      if (state.phase !== 'sessionReview') {
        return state;
      }

      return {
        ...state,
        phase: 'completed',
        loggedExercises: recordUnvisitedParkedExercisesAsSkipped(state, plannedSession),
      };
    }
  }
}

/**
 * Where a session that was interrupted should pick up.
 *
 * Rebuilt from what was stored rather than from anything held in memory, because
 * the thing being recovered from is the phone locking itself, the browser being
 * closed, or the gym wifi dropping — in every one of those the memory is gone
 * and the Firestore document is all there is.
 *
 * It resumes at the brief for the first exercise that is neither skipped nor
 * finished, which is deliberately one step back from where it left off: coming
 * back to a set already counting down, having forgotten which weight was on the
 * machine, would be worse than reading the brief again.
 */
export function resumeActiveSessionState(
  plannedSession: PlannedSession,
  loggedExercises: PerformedExercise[],
): ActiveSessionState {
  const unfinishedExerciseIndex = plannedSession.exercises.findIndex((plannedExercise) =>
    isPlannedExerciseStillOwed(plannedExercise, loggedExercises),
  );
  const hasUnfinishedExercise = unfinishedExerciseIndex >= 0;

  const setsAlreadyLogged = hasUnfinishedExercise
    ? countSetsLoggedAgainstExercise(
        loggedExercises,
        plannedSession.exercises[unfinishedExerciseIndex]?.exerciseId ?? '',
      )
    : 0;

  /*
   * Nothing comes back parked. Parking is a fact about a machine at a moment,
   * and the thing being recovered from here is a locked phone or a dropped
   * connection — by the time the session is open again the queue has moved on.
   */
  return {
    ...createInitialActiveSessionState(),
    /*
     * Never back to the warm-up. Anything already logged means he is warm, and
     * being asked to redo the ankle rocks after a dropped connection would be
     * the app not believing him.
     */
    phase: hasUnfinishedExercise ? 'exerciseBrief' : 'sessionReview',
    currentExerciseIndex: hasUnfinishedExercise
      ? unfinishedExerciseIndex
      : plannedSession.exercises.length,
    // Carrying on from the sets already stored, rather than logging set 1 twice.
    currentSetNumber: setsAlreadyLogged + 1,
    loggedExercises,
  };
}
