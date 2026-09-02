import { create } from 'zustand';

import { findExerciseById } from '@/content/exercises/allExercises';
import {
  findProgramTemplateById,
  defaultProgramTemplateId,
} from '@/content/programs/allProgramTemplates';
import {
  applyActiveSessionEvent,
  createInitialActiveSessionState,
  findCurrentPlannedExercise,
  resumeActiveSessionState,
  type ActiveSessionEvent,
  type ActiveSessionState,
} from '@/domain/activeSessionMachine';
import { formatIsoDate } from '@/domain/calendarDates';
import {
  buildExercisePerformanceHistories,
  countCompletedSessions,
  findLastCompletedSessionAt,
} from '@/domain/exercisePerformanceHistory';
import { addUnavailableExerciseId } from '@/domain/exerciseAvailability';
import { determineLayoffAdjustment, type LayoffAdjustment } from '@/domain/layoffRecovery';
import { findPersonalRecordUpdates } from '@/domain/personalRecordProgress';
import { findPhaseForWeekNumber, findSessionTemplate } from '@/domain/programPhases';
import {
  advanceProgramAssignmentAfterSession,
  createStartingProgramAssignment,
  resolveSessionStartPosition,
} from '@/domain/programAssignmentProgress';
import { calculateWholeDaysBetween } from '@/domain/sessionScheduling';
import {
  buildPerformedSetFromDraft,
  buildWorkoutSessionRecord,
  createSetLogDraft,
  summariseLoggedSession,
  type LoggedSessionSummary,
  type SetLogDraft,
} from '@/domain/sessionLogging';
import { resolveSessionPlan, type PlannedSession } from '@/domain/sessionPlanning';
import {
  readAllPersonalRecords,
  writePersonalRecord,
} from '@/services/repositories/personalRecordsRepository';
import {
  createProgramAssignment,
  readActiveProgramAssignment,
  updateProgramAssignment,
} from '@/services/repositories/programAssignmentRepository';
import { writeUnavailableExerciseIds } from '@/services/repositories/userProfileRepository';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import { readUserSettings } from '@/services/repositories/userSettingsRepository';
import {
  createWorkoutSession,
  readInProgressWorkoutSession,
  readRecentWorkoutSessions,
  saveWorkoutSession,
} from '@/services/repositories/workoutSessionRepository';
import type { ProgramTemplate } from '@/types/programTypes';
import type { CoachVerbosityLevel } from '@/types/coachVoiceTypes';
import type { PerformedSet, ProgramAssignment, WithDocumentId } from '@/types/trainingHistoryTypes';
import type { LoadingStyle, RepRange, SessionLetter } from '@/types/trainingVocabulary';
import type { UserProfile } from '@/types/userAccountTypes';

/**
 * The impure half of the session player.
 *
 * `src/domain/activeSessionMachine.ts` decides what may follow what. This owns
 * the three things it is not allowed to touch: the clock, Firestore, and the
 * fact that a person is standing in a gym while both are unreliable.
 *
 * **Nothing here awaits a Firestore write.** A write made while offline does not
 * resolve until the device reconnects, so awaiting one would freeze the screen
 * in a dead spot — exactly where this app is used. The writes are fired and
 * their failures captured; Firestore's local cache flushes them on reconnect.
 * Because every save writes the session document whole, only the most recent
 * write has to land, so a write that never went out costs nothing.
 */

/** Enough history for progression and for the layoff rules, and no more. */
const RECENT_SESSION_COUNT = 40;

export type SessionPreparationStatus = 'idle' | 'preparing' | 'ready' | 'failed';

type ActiveSessionStore = {
  preparationStatus: SessionPreparationStatus;
  preparationErrorMessage: string | null;

  userId: string | null;
  coachVerbosity: CoachVerbosityLevel;
  shouldKeepScreenAwakeDuringSession: boolean;
  shouldPlayRestTimerSound: boolean;

  programAssignment: WithDocumentId<ProgramAssignment> | null;
  plannedSession: PlannedSession | null;
  layoffAdjustment: LayoffAdjustment | null;

  /** Null until the session document has been created in Firestore. */
  workoutSessionId: string | null;
  isCreatingWorkoutSession: boolean;

  sessionStartedAt: Date | null;
  sessionFinishedAt: Date | null;

  /** True when this session was picked up from one the phone interrupted. */
  didResumeInterruptedSession: boolean;

  /** Completed sessions before this one. Rations the coach's praise. */
  completedSessionCount: number;

  /**
   * The profile's list of movements his gym has not got, as it stood when the
   * session opened, plus anything flagged during it.
   *
   * Held here so that flagging a second movement in the same session does not
   * overwrite the first. The profile subscription would eventually bring the
   * server's copy back, but "eventually" is not a thing to rely on between two
   * taps in a gym.
   */
  unavailableExerciseIds: string[];

  machineState: ActiveSessionState;

  /** The set currently being performed or recorded. Null outside those phases. */
  setLogDraft: SetLogDraft | null;

  /** The set just recorded, so the rest screen can respond to what happened. */
  lastLoggedSet: PerformedSet | null;

  saveErrorMessage: string | null;
  finishedSummary: LoggedSessionSummary | null;

  prepareSession: (userId: string, userProfile: UserProfile) => Promise<void>;
  sendEvent: (event: ActiveSessionEvent) => void;
  updateSetLogDraft: (changes: Partial<SetLogDraft>) => void;
  logCurrentSet: () => void;
  finishSession: () => void;

  /**
   * Records that his gym has not got the machine for the exercise he is on, and
   * moves the session past it.
   */
  markCurrentExerciseUnavailable: () => void;

  leaveSession: () => void;
};

/** Stored on the skipped exercise, so the session record says why. */
const NOT_AVAILABLE_SKIP_REASON = 'The gym has not got this machine.';

function resolveLoadingStyleForExercise(exerciseId: string): LoadingStyle | null {
  return findExerciseById(exerciseId)?.loadingStyle ?? null;
}

/**
 * Equivalent movements for an exercise, best first.
 *
 * `src/domain/` may not read `src/content/`, so the planner and the outline
 * both take this as a function. It is the same one-liner everywhere it is
 * needed, which is the price of that rule and a fair one.
 */
function resolveSubstituteExerciseIds(exerciseId: string): string[] {
  return findExerciseById(exerciseId)?.substituteExerciseIds ?? [];
}


/**
 * The rep range today's programme writes for each exercise in this session.
 *
 * Needed to rebuild the range a stored set was performed under — see
 * `buildExercisePerformanceHistories`. Built from the session template rather
 * than from the plan, because the plan is what it is about to produce.
 */
function buildRepRangeLookup(
  programTemplate: ProgramTemplate,
  weekNumber: number,
  sessionLetter: SessionLetter,
): (exerciseId: string) => RepRange | null {
  const phase = findPhaseForWeekNumber(programTemplate, weekNumber);
  const sessionTemplate = phase ? findSessionTemplate(phase, sessionLetter) : null;

  const repRangesByExerciseId = new Map<string, RepRange>();

  for (const slot of sessionTemplate?.exerciseSlots ?? []) {
    if (slot.prescription.kind === 'weightAndReps' || slot.prescription.kind === 'bodyweightReps') {
      repRangesByExerciseId.set(slot.exerciseId, slot.prescription.repRange);
    }
  }

  return (exerciseId: string) => repRangesByExerciseId.get(exerciseId) ?? null;
}

/**
 * The set being filled in, after a transition.
 *
 * Created at the moment a set begins, so it always carries the exercise and set
 * number now in force. It survives the move into `loggingSet` — that is the
 * same set, being asked about — and is cleared everywhere else, so nothing can
 * log a stale draft against the next exercise.
 */
function resolveSetLogDraft(
  previousState: ActiveSessionState,
  nextState: ActiveSessionState,
  plannedSession: PlannedSession,
  previousDraft: SetLogDraft | null,
): SetLogDraft | null {
  if (nextState.phase === 'loggingSet') {
    return previousDraft;
  }

  if (nextState.phase !== 'setInProgress') {
    return null;
  }

  const hasJustEnteredTheSet =
    previousState.phase !== 'setInProgress' ||
    previousState.currentSetNumber !== nextState.currentSetNumber;

  if (!hasJustEnteredTheSet && previousDraft) {
    return previousDraft;
  }

  const plannedExercise = findCurrentPlannedExercise(nextState, plannedSession);

  return plannedExercise ? createSetLogDraft(plannedExercise, nextState.currentSetNumber) : null;
}

export const useActiveSessionStore = create<ActiveSessionStore>()((set, get) => ({
  preparationStatus: 'idle',
  preparationErrorMessage: null,

  userId: null,
  coachVerbosity: 'standard',
  shouldKeepScreenAwakeDuringSession: true,
  shouldPlayRestTimerSound: true,

  programAssignment: null,
  plannedSession: null,
  layoffAdjustment: null,

  workoutSessionId: null,
  isCreatingWorkoutSession: false,

  sessionStartedAt: null,
  sessionFinishedAt: null,
  didResumeInterruptedSession: false,
  completedSessionCount: 0,
  unavailableExerciseIds: [],

  machineState: createInitialActiveSessionState(),
  setLogDraft: null,
  lastLoggedSet: null,

  saveErrorMessage: null,
  finishedSummary: null,

  /**
   * Everything the session needs, read once when the screen opens.
   *
   * Reads are awaited — unlike writes, a Firestore read resolves from the local
   * cache when there is no connection, so this is fast offline rather than
   * stuck.
   */
  prepareSession: async (userId, userProfile) => {
    set({
      preparationStatus: 'preparing',
      preparationErrorMessage: null,
      userId,
      saveErrorMessage: null,
      finishedSummary: null,
      lastLoggedSet: null,
      setLogDraft: null,
      sessionFinishedAt: null,
    });

    try {
      const [userSettings, existingAssignment, recentSessions, interruptedSession] =
        await Promise.all([
          readUserSettings(userId),
          readActiveProgramAssignment(userId),
          readRecentWorkoutSessions(userId, RECENT_SESSION_COUNT),
          readInProgressWorkoutSession(userId),
        ]);

      /*
       * The first session is where the programme actually begins. Onboarding
       * writes a profile and settings; it deliberately does not decide what he
       * is training, because that is this screen's question.
       */
      const now = new Date();
      let programAssignment = existingAssignment;

      if (!programAssignment) {
        const startingAssignment = createStartingProgramAssignment(
          resolveDefaultProgramTemplate(),
          formatIsoDate(now),
        );
        const assignmentId = await createProgramAssignment(userId, startingAssignment);

        programAssignment = { ...startingAssignment, documentId: assignmentId };
      }

      const programTemplate = findProgramTemplateById(programAssignment.programTemplateId);

      if (!programTemplate) {
        throw new Error(
          `The programme "${programAssignment.programTemplateId}" is not in this build.`,
        );
      }

      const lastCompletedSessionAt = findLastCompletedSessionAt(recentSessions);
      const layoffAdjustment = determineLayoffAdjustment(
        lastCompletedSessionAt === null
          ? null
          : calculateWholeDaysBetween(lastCompletedSessionAt, now),
      );

      const startPosition = resolveSessionStartPosition(
        programAssignment,
        programTemplate,
        layoffAdjustment,
      );

      /*
       * A session left in progress wins over what the assignment says is next.
       * It is the session he is standing in the middle of, and its week and
       * letter are the ones already written against the sets he has logged.
       */
      const weekNumber = interruptedSession?.weekNumber ?? startPosition.weekNumber;
      const sessionLetter = interruptedSession?.sessionLetter ?? startPosition.sessionLetter;

      const plannedSession = resolveSessionPlan({
        programTemplate,
        weekNumber,
        sessionLetter,
        sessionStartHourOfDay: now.getHours(),
        performanceHistoryByExerciseId: buildExercisePerformanceHistories({
          recentSessions,
          resolveCurrentRepRangeForExercise: buildRepRangeLookup(
            programTemplate,
            weekNumber,
            sessionLetter,
          ),
        }),
        activePainAreas: userProfile.painAreas,
        excludedExerciseIds: userProfile.excludedExerciseIds,
        unavailableExerciseIds: userProfile.unavailableExerciseIds,
        resolveLoadingStyleForExercise,
        resolveSubstituteExerciseIds,
        layoffLoadMultiplier: layoffAdjustment.loadMultiplier,
      });

      if (!plannedSession) {
        throw new Error(
          `Week ${String(weekNumber)} session ${sessionLetter} is not part of this programme.`,
        );
      }

      /*
       * A layoff restart is written back straight away, so the phase begins
       * again once rather than every session until ten more days pass.
       */
      if (startPosition.didRestartPhase && !interruptedSession) {
        void updateProgramAssignment(userId, programAssignment.documentId, {
          currentWeekNumber: startPosition.weekNumber,
          currentPhaseNumber: startPosition.phaseNumber,
        }).catch(() => {
          // Cosmetic if it fails: the plan for today is already resolved.
        });
      }

      set({
        preparationStatus: 'ready',
        coachVerbosity: userSettings.coachVerbosity,
        shouldKeepScreenAwakeDuringSession: userSettings.shouldKeepScreenAwakeDuringSession,
        shouldPlayRestTimerSound: userSettings.shouldPlayRestTimerSound,
        programAssignment,
        plannedSession,
        layoffAdjustment,
        workoutSessionId: interruptedSession?.documentId ?? null,
        sessionStartedAt: interruptedSession?.startedAt ?? now,
        didResumeInterruptedSession: interruptedSession !== null,
        completedSessionCount: countCompletedSessions(recentSessions),
        unavailableExerciseIds: userProfile.unavailableExerciseIds,
        machineState: interruptedSession
          ? resumeActiveSessionState(plannedSession, interruptedSession.performedExercises)
          : createInitialActiveSessionState(),
      });
    } catch (error: unknown) {
      set({
        preparationStatus: 'failed',
        preparationErrorMessage: describeRepositoryError(error),
      });
    }
  },

  sendEvent: (event) => {
    const { machineState, plannedSession, setLogDraft } = get();

    if (!plannedSession) {
      return;
    }

    const nextMachineState = applyActiveSessionEvent(machineState, event, plannedSession);

    if (nextMachineState === machineState) {
      return;
    }

    set({
      machineState: nextMachineState,
      setLogDraft: resolveSetLogDraft(machineState, nextMachineState, plannedSession, setLogDraft),
    });

    const hasChangedTheLog = nextMachineState.loggedExercises !== machineState.loggedExercises;

    if (hasChangedTheLog) {
      persistSessionProgress(set, get);
    }
  },

  updateSetLogDraft: (changes) => {
    const { setLogDraft } = get();

    if (!setLogDraft) {
      return;
    }

    set({ setLogDraft: { ...setLogDraft, ...changes } });
  },

  logCurrentSet: () => {
    const { setLogDraft, machineState, sendEvent } = get();

    if (!setLogDraft) {
      return;
    }

    const completedAt = new Date();
    const performedSet = buildPerformedSetFromDraft(
      setLogDraft,
      completedAt,
      machineState.restSecondsBeforeCurrentSet,
    );

    set({ lastLoggedSet: performedSet });
    sendEvent({ kind: 'setLogged', performedSet, occurredAt: completedAt });
  },

  finishSession: () => {
    const { machineState, plannedSession, programAssignment, sessionStartedAt, userId } = get();

    if (!plannedSession || !programAssignment || !sessionStartedAt || userId === null) {
      return;
    }

    const finishedAt = new Date();

    set({
      sessionFinishedAt: finishedAt,
      finishedSummary: summariseLoggedSession({
        plannedSession,
        loggedExercises: machineState.loggedExercises,
        startedAt: sessionStartedAt,
        finishedAt,
        resolveLoadingStyleForExercise,
      }),
    });

    get().sendEvent({ kind: 'sessionFinished' });

    // The machine only reaches `completed` from the review, so a stray call
    // from anywhere else stops here rather than advancing the programme.
    if (get().machineState.phase !== 'completed') {
      return;
    }

    persistSessionProgress(set, get);
    recordPersonalRecordsFromFinishedSession(set, get);

    /*
     * The document id is stripped before the assignment goes back to the domain
     * layer and back to Firestore. It is where the document lives, not a field
     * on it, and writing it into the document would make it two of them.
     */
    const { documentId: assignmentId, ...storedAssignment } = programAssignment;

    const advancedAssignment = advanceProgramAssignmentAfterSession({
      assignment: storedAssignment,
      programTemplate:
        findProgramTemplateById(storedAssignment.programTemplateId) ??
        resolveDefaultProgramTemplate(),
      completedSessionLetter: plannedSession.sessionLetter,
      completedWeekNumber: plannedSession.weekNumber,
      completedOn: formatIsoDate(finishedAt),
    });

    set({ programAssignment: { ...advancedAssignment, documentId: assignmentId } });

    void updateProgramAssignment(userId, assignmentId, advancedAssignment).catch(
      (error: unknown) => {
        set({ saveErrorMessage: describeRepositoryError(error) });
      },
    );
  },

  /**
   * The whole of F13's in-session half.
   *
   * Two things happen and they are deliberately different in kind. The exercise
   * is skipped **today**, with a reason, because there is no machine to do it
   * on. And the profile is told, which is what changes **next** session: the
   * planner swaps in the best equivalent and the brief says so.
   *
   * The write is not awaited, like every other write in this file — see the note
   * at the top. If it never lands, today's session is still correct and the flag
   * simply was not set, which is a thing he can do again.
   */
  markCurrentExerciseUnavailable: () => {
    const { userId, plannedSession, machineState, unavailableExerciseIds, sendEvent } = get();

    if (userId === null || !plannedSession) {
      return;
    }

    const plannedExercise = findCurrentPlannedExercise(machineState, plannedSession);

    if (!plannedExercise) {
      return;
    }

    const nextUnavailableExerciseIds = addUnavailableExerciseId(
      unavailableExerciseIds,
      plannedExercise.exerciseId,
    );

    set({ unavailableExerciseIds: nextUnavailableExerciseIds });

    void writeUnavailableExerciseIds(userId, nextUnavailableExerciseIds).catch(
      (error: unknown) => {
        set({ saveErrorMessage: describeRepositoryError(error) });
      },
    );

    sendEvent({ kind: 'exerciseSkipped', skipReason: NOT_AVAILABLE_SKIP_REASON });
  },

  leaveSession: () => {
    set({
      preparationStatus: 'idle',
      preparationErrorMessage: null,
      programAssignment: null,
      plannedSession: null,
      layoffAdjustment: null,
      workoutSessionId: null,
      isCreatingWorkoutSession: false,
      sessionStartedAt: null,
      sessionFinishedAt: null,
      didResumeInterruptedSession: false,
      unavailableExerciseIds: [],
      machineState: createInitialActiveSessionState(),
      setLogDraft: null,
      lastLoggedSet: null,
      saveErrorMessage: null,
      finishedSummary: null,
    });
  },
}));

/** The programme a brand new account is put on. */
function resolveDefaultProgramTemplate(): ProgramTemplate {
  const programTemplate = findProgramTemplateById(defaultProgramTemplateId);

  if (!programTemplate) {
    throw new Error('The default programme template is missing from this build.');
  }

  return programTemplate;
}

/**
 * Stores any lift that was the best it has ever been.
 *
 * Runs once, at the end, rather than per set — a record is a property of the
 * session as a whole, and checking after every set would mean three writes to
 * beat one record by three reps.
 *
 * **Only weight-and-reps movements are eligible.** A farmer's carry stores
 * metres in `actualReps` and a treadmill walk stores minutes, and Epley on
 * either produces a confident, meaningless number. Which is which is a fact
 * about the prescription, which is why the list is resolved here and passed in —
 * `src/domain/` may not read `src/content/`.
 *
 * The comparison itself is `findPersonalRecordUpdates`, and the repository
 * deliberately does not second-guess it. See the note on `writePersonalRecord`.
 */
function recordPersonalRecordsFromFinishedSession(
  set: (partial: Partial<ActiveSessionStore>) => void,
  get: () => ActiveSessionStore,
): void {
  const { userId, plannedSession, machineState, workoutSessionId, sessionFinishedAt } = get();

  /*
   * No session document id means the very first write is still in flight, which
   * only happens if the network died between the first set and the last. The
   * records are skipped rather than stored against an id that does not exist:
   * they are understated until the lift is next beaten, and nothing else breaks.
   */
  if (!userId || !plannedSession || workoutSessionId === null) {
    return;
  }

  const exerciseIdsEligibleForRecords = plannedSession.exercises
    .filter((plannedExercise) => plannedExercise.prescription.kind === 'weightAndReps')
    .map((plannedExercise) => plannedExercise.exerciseId);

  void readAllPersonalRecords(userId)
    .then(async (existingRecords) => {
      const recordUpdates = findPersonalRecordUpdates({
        performedExercises: machineState.loggedExercises,
        existingRecords,
        exerciseIdsEligibleForRecords,
        achievedOn: formatIsoDate(sessionFinishedAt ?? new Date()),
        achievedInSessionId: workoutSessionId,
      });

      await Promise.all(
        recordUpdates.map((recordUpdate) => writePersonalRecord(userId, recordUpdate.record)),
      );
    })
    .catch(() => {
      /*
       * Worth saying, and worth saying accurately: the session itself is safe.
       * Only the records are behind, and they catch up the next time one of
       * these lifts is beaten.
       */
      set({
        saveErrorMessage:
          'Your session is saved. Your personal records could not be updated just now — they will catch up next session.',
      });
    });
}

/**
 * Writes the session as it stands, creating the document the first time.
 *
 * Not awaited by anything — see the note at the top of this file. The first
 * call creates the document and every later one replaces it whole, so a save
 * that never reached the server is simply superseded by the next one.
 */
function persistSessionProgress(
  set: (partial: Partial<ActiveSessionStore>) => void,
  get: () => ActiveSessionStore,
): void {
  const {
    userId,
    plannedSession,
    programAssignment,
    sessionStartedAt,
    sessionFinishedAt,
    machineState,
    workoutSessionId,
    isCreatingWorkoutSession,
  } = get();

  if (!userId || !plannedSession || !programAssignment || !sessionStartedAt) {
    return;
  }

  const sessionRecord = buildWorkoutSessionRecord({
    programAssignmentId: programAssignment.documentId,
    plannedSession,
    loggedExercises: machineState.loggedExercises,
    startedAt: sessionStartedAt,
    finishedAt: sessionFinishedAt ?? new Date(),
    resolveLoadingStyleForExercise,
    status: machineState.phase === 'completed' ? 'completed' : 'inProgress',
    overallFeeling: machineState.overallFeeling,
    sessionNotes: machineState.sessionNotes,
  });

  if (workoutSessionId !== null) {
    void saveWorkoutSession(userId, workoutSessionId, sessionRecord).catch((error: unknown) => {
      set({ saveErrorMessage: describeRepositoryError(error) });
    });

    return;
  }

  if (isCreatingWorkoutSession) {
    /*
     * The document is on its way and does not have an id yet. Nothing is lost:
     * the write that follows the id arriving carries the whole session.
     */
    return;
  }

  set({ isCreatingWorkoutSession: true });

  void createWorkoutSession(userId, sessionRecord)
    .then((createdSessionId) => {
      set({ workoutSessionId: createdSessionId, isCreatingWorkoutSession: false });

      // Anything logged while the id was in flight is written now.
      persistSessionProgress(set, get);
    })
    .catch((error: unknown) => {
      set({ isCreatingWorkoutSession: false, saveErrorMessage: describeRepositoryError(error) });
    });
}
