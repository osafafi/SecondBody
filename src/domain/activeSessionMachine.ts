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
 * Leaves the current exercise behind and points at the next one.
 *
 * The phase becomes `sessionReview` once there is no next one, which is the only
 * way a session finishes — running out of exercises, rather than a separate "am
 * I done yet" check somewhere in the UI.
 */
function moveToNextExercise(
  state: ActiveSessionState,
  plannedSession: PlannedSession,
  loggedExercises: PerformedExercise[],
): ActiveSessionState {
  const nextExerciseIndex = state.currentExerciseIndex + 1;
  const hasAnotherExercise = nextExerciseIndex < plannedSession.exercises.length;

  return {
    ...state,
    phase: hasAnotherExercise ? 'exerciseBrief' : 'sessionReview',
    currentExerciseIndex: nextExerciseIndex,
    currentSetNumber: 1,
    loggedExercises,
    restStartedAt: null,
    restTargetSeconds: 0,
    restSecondsBeforeCurrentSet: null,
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

  const isLastExercise = state.currentExerciseIndex === plannedSession.exercises.length - 1;

  if (!hasAnotherSet && isLastExercise) {
    return moveToNextExercise(state, plannedSession, loggedExercises);
  }

  /*
   * Rest happens between two sets of one exercise AND between two exercises.
   * Walking straight from a set of squats into the brief for the next movement
   * is how a session turns into a circuit, which is not what this programme is.
   */
  return {
    ...state,
    phase: 'resting',
    currentExerciseIndex: hasAnotherSet
      ? state.currentExerciseIndex
      : state.currentExerciseIndex + 1,
    currentSetNumber: hasAnotherSet ? state.currentSetNumber + 1 : 1,
    loggedExercises,
    restStartedAt: occurredAt,
    restTargetSeconds: plannedExercise.restSecondsBetweenSets,
    // The rest that has just begun belongs to the set that follows it.
    restSecondsBeforeCurrentSet: null,
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

  return moveToNextExercise(state, plannedSession, loggedExercises);
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
       * Set 1 can only mean the rest moved the session on to a new exercise,
       * because a set number never resets within one. So the brief is shown for
       * the new movement, and the same rest leads straight back into the next
       * set when it has not moved on.
       */
      return {
        ...state,
        phase: state.currentSetNumber === 1 ? 'exerciseBrief' : 'setInProgress',
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
      return state.phase === 'sessionReview' ? { ...state, phase: 'completed' } : state;
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
  const isExerciseStillOwed = (plannedExercise: PlannedExercise): boolean => {
    const loggedExercise = loggedExercises.find(
      (candidate) => candidate.exerciseId === plannedExercise.exerciseId,
    );

    if (!loggedExercise) {
      return true;
    }

    if (loggedExercise.wasSkipped) {
      return false;
    }

    /*
     * A set that caused sharp pain ends that exercise for the day, so an
     * exercise short of its set count is only owed more work when the last set
     * logged against it was pain-free.
     */
    const lastPerformedSet = loggedExercise.performedSets.at(-1);

    if (lastPerformedSet?.didCauseSharpPain === true) {
      return false;
    }

    return loggedExercise.performedSets.length < plannedExercise.workingSetCount;
  };

  const unfinishedExerciseIndex = plannedSession.exercises.findIndex(isExerciseStillOwed);
  const hasUnfinishedExercise = unfinishedExerciseIndex >= 0;

  const setsAlreadyLogged = hasUnfinishedExercise
    ? (loggedExercises.find(
        (candidate) =>
          candidate.exerciseId === plannedSession.exercises[unfinishedExerciseIndex]?.exerciseId,
      )?.performedSets.length ?? 0)
    : 0;

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
