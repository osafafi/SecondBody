import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthentication } from '@/app/useAuthentication';
import { APP_ROUTE_PATHS } from '@/app/appRoutes';
import { useUserProfile } from '@/app/useUserProfile';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { PendingScreen } from '@/components/PendingScreen/PendingScreen';
import { findExerciseById } from '@/content/exercises/allExercises';
import { findCurrentPlannedExercise } from '@/domain/activeSessionMachine';
import { shouldSuggestImmediateLoadIncrease } from '@/domain/exercisePrescription';
import { resolveSmallestLoadIncrementKilograms } from '@/domain/loadIncrements';
import { buildSessionBoard, type SessionBoardEntry } from '@/domain/sessionBoard';
import { countLoggedSets, countPlannedSets } from '@/domain/sessionLogging';
import type { PlannedExercise } from '@/domain/sessionPlanning';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import type { PerformedExercise } from '@/types/trainingHistoryTypes';

import {
  selectCalibrationInstructionLine,
  selectDeloadWeekLine,
  selectLoadChangeLine,
  selectReturningFromLayoffLine,
  selectSessionCompletedLine,
  selectSessionOpeningLine,
  selectSetFeedbackLine,
  selectWarmupFinishedLine,
  type CoachContext,
} from './activeSessionCoachLines';
import styles from './ActiveSessionScreen.module.css';
import { ExerciseBriefPanel } from './components/ExerciseBriefPanel';
import { ExercisePreviewOverlay } from './components/ExercisePreviewOverlay';
import { RestTimerPanel } from './components/RestTimerPanel';
import { SessionBoardOverlay } from './components/SessionBoardOverlay';
import { SessionHeaderBar } from './components/SessionHeaderBar';
import { SessionReviewPanel } from './components/SessionReviewPanel';
import { SessionSummaryPanel } from './components/SessionSummaryPanel';
import { SetInProgressPanel } from './components/SetInProgressPanel';
import { SetLoggingPanel } from './components/SetLoggingPanel';
import { WarmupPanel } from './components/WarmupPanel';
import { useActiveSessionStore } from './useActiveSessionStore';

/**
 * What is on top of the session, if anything.
 *
 * One value rather than two booleans, because "the board is open and so is the
 * preview" and "the preview is open on its own" are genuinely different — the
 * back button goes somewhere different — and two booleans would let a third,
 * meaningless combination exist.
 */
type SessionOverlayState =
  | { kind: 'none' }
  | { kind: 'board' }
  | { kind: 'exercisePreview'; exerciseIndex: number; returnsToTheBoard: boolean };

/**
 * The live workout player, and the heart of the app.
 *
 * Registered outside `AppShell` so it takes over the whole display with no
 * bottom navigation to hit by accident mid-set — a decision from M1 that has
 * been waiting in `App.tsx` with a comment on it ever since.
 *
 * The screen itself holds almost no logic. `useActiveSessionStore` owns the
 * session, `src/domain/activeSessionMachine.ts` owns what may follow what, and
 * this decides which panel that means drawing.
 */
export function ActiveSessionScreen() {
  const navigate = useNavigate();
  const { signedInUser } = useAuthentication();
  const { userProfile } = useUserProfile();

  const preparationStatus = useActiveSessionStore((store) => store.preparationStatus);
  const preparationErrorMessage = useActiveSessionStore((store) => store.preparationErrorMessage);
  const plannedSession = useActiveSessionStore((store) => store.plannedSession);
  const layoffAdjustment = useActiveSessionStore((store) => store.layoffAdjustment);
  const machineState = useActiveSessionStore((store) => store.machineState);
  const setLogDraft = useActiveSessionStore((store) => store.setLogDraft);
  const lastLoggedSet = useActiveSessionStore((store) => store.lastLoggedSet);
  const sessionStartedAt = useActiveSessionStore((store) => store.sessionStartedAt);
  const coachVerbosity = useActiveSessionStore((store) => store.coachVerbosity);
  const completedSessionCount = useActiveSessionStore((store) => store.completedSessionCount);
  const didResumeInterruptedSession = useActiveSessionStore(
    (store) => store.didResumeInterruptedSession,
  );
  const shouldKeepScreenAwakeDuringSession = useActiveSessionStore(
    (store) => store.shouldKeepScreenAwakeDuringSession,
  );
  const shouldPlayRestTimerSound = useActiveSessionStore((store) => store.shouldPlayRestTimerSound);
  const saveErrorMessage = useActiveSessionStore((store) => store.saveErrorMessage);
  const finishedSummary = useActiveSessionStore((store) => store.finishedSummary);

  const prepareSession = useActiveSessionStore((store) => store.prepareSession);
  const sendEvent = useActiveSessionStore((store) => store.sendEvent);
  const updateSetLogDraft = useActiveSessionStore((store) => store.updateSetLogDraft);
  const logCurrentSet = useActiveSessionStore((store) => store.logCurrentSet);
  const finishSession = useActiveSessionStore((store) => store.finishSession);
  const leaveSession = useActiveSessionStore((store) => store.leaveSession);

  const [isLeaveSheetOpen, setIsLeaveSheetOpen] = useState(false);
  const [sessionOverlay, setSessionOverlay] = useState<SessionOverlayState>({ kind: 'none' });

  const signedInUserId = signedInUser?.userId ?? null;

  /**
   * Prepared once, when the screen opens.
   *
   * The guard is load-bearing rather than an optimisation. `userProfile` comes
   * from a Firestore subscription, so it arrives again whenever the server
   * corrects the cached copy — and re-planning the session on that would throw
   * away everything logged so far, mid-workout, for no reason the person could
   * possibly understand. Retrying after a failure goes through the button
   * below, which asks for it deliberately.
   */
  const hasRequestedPreparation = useRef(false);

  useEffect(() => {
    if (hasRequestedPreparation.current || signedInUserId === null || !userProfile) {
      return;
    }

    hasRequestedPreparation.current = true;
    void prepareSession(signedInUserId, userProfile);
  }, [signedInUserId, userProfile, prepareSession]);

  /*
   * Cleared on the way out rather than on the way in, so that the next session
   * cannot inherit a plan, a draft or a summary from this one. Its own effect
   * with no dependencies: this must run when the screen unmounts and never in
   * response to a profile arriving.
   */
  useEffect(() => {
    return () => {
      leaveSession();
    };
  }, [leaveSession]);

  useScreenWakeLock(
    shouldKeepScreenAwakeDuringSession &&
      preparationStatus === 'ready' &&
      machineState.phase !== 'completed',
  );

  if (preparationStatus === 'preparing' || preparationStatus === 'idle') {
    return <PendingScreen label="Working out what is on today" />;
  }

  if (preparationStatus === 'failed' || !plannedSession || !sessionStartedAt) {
    return (
      <main className={styles.errorScreen}>
        <GradientSurface variant="glass" radius="xlarge" className={styles.errorPanel}>
          <h1 className={styles.errorTitle}>Could not open today&rsquo;s session</h1>

          {preparationErrorMessage ? (
            <p className={styles.errorMessage} role="alert">
              {preparationErrorMessage}
            </p>
          ) : null}

          <GradientButton
            tone="primary"
            isFullWidth
            onClick={() => {
              if (signedInUserId !== null && userProfile) {
                void prepareSession(signedInUserId, userProfile);
              }
            }}
          >
            Try again
          </GradientButton>

          <GradientButton
            tone="ghost"
            isFullWidth
            onClick={() => {
              void navigate(APP_ROUTE_PATHS.today);
            }}
          >
            Back to today
          </GradientButton>
        </GradientSurface>
      </main>
    );
  }

  const plannedExercise = findCurrentPlannedExercise(machineState, plannedSession);
  const loggedSetCount = countLoggedSets(machineState.loggedExercises);
  const plannedSetCount = countPlannedSets(plannedSession);

  const coachContext: CoachContext = {
    configuredVerbosity: coachVerbosity,
    rotationIndex: completedSessionCount + loggedSetCount,
  };

  const goHome = () => {
    void navigate(APP_ROUTE_PATHS.today);
  };

  const handleExerciseSkipped = () => {
    sendEvent({ kind: 'exerciseSkipped', skipReason: null });
  };

  const handleExerciseParked = () => {
    sendEvent({ kind: 'exerciseParked' });
  };

  const sessionBoardEntries = buildSessionBoard(machineState, plannedSession);

  const closeSessionOverlay = () => {
    setSessionOverlay({ kind: 'none' });
  };

  const openSessionBoard = () => {
    setSessionOverlay({ kind: 'board' });
  };

  /**
   * Sends the session to a movement chosen from the board.
   *
   * The overlay closes first so that what is underneath when it goes is the
   * brief for the exercise he picked, rather than the panel he was on a moment
   * ago and is about to leave.
   */
  const handleExerciseChosen = (exerciseIndex: number) => {
    closeSessionOverlay();
    sendEvent({ kind: 'exerciseSelected', exerciseIndex });
  };

  const previewedBoardEntry: SessionBoardEntry | null =
    sessionOverlay.kind === 'exercisePreview'
      ? (sessionBoardEntries[sessionOverlay.exerciseIndex] ?? null)
      : null;

  /*
   * The two things worth saying before a session that is not a normal one. Both
   * are said once, at the warm-up, and both are null the rest of the time —
   * which is most sessions.
   */
  const deloadCoachLine = plannedSession.isDeloadWeek ? selectDeloadWeekLine(coachContext) : null;
  const layoffCoachLine = layoffAdjustment?.isReturningFromLayoff
    ? selectReturningFromLayoffLine(coachContext)
    : null;

  const renderCurrentPhase = () => {
    switch (machineState.phase) {
      case 'warmingUp':
        return (
          <WarmupPanel
            warmup={plannedSession.warmup}
            rampSet={plannedSession.rampSet}
            coachLine={selectSessionOpeningLine(coachContext)}
            onWarmupFinished={() => {
              sendEvent({ kind: 'warmupFinished' });
            }}
          />
        );

      case 'exerciseBrief':
        return plannedExercise ? (
          <ExerciseBriefPanel
            plannedExercise={plannedExercise}
            exercisePosition={machineState.currentExerciseIndex + 1}
            exerciseCount={plannedSession.exercises.length}
            loggedSetCount={machineState.currentSetNumber - 1}
            isCalibrationWeek={plannedSession.isCalibrationWeek}
            wasWaitingOnAMachine={machineState.parkedExerciseIds.includes(
              plannedExercise.exerciseId,
            )}
            calibrationCoachLine={selectCalibrationInstructionLine(coachContext)}
            loadChangeCoachLine={
              plannedExercise.prescription.kind === 'weightAndReps' ||
              plannedExercise.prescription.kind === 'loadedCarry'
                ? selectLoadChangeLine(plannedExercise.prescription.loadDecisionReason, {
                    ...coachContext,
                    rotationIndex: machineState.currentExerciseIndex,
                  })
                : null
            }
            onExerciseStarted={() => {
              sendEvent({ kind: 'exerciseStarted' });
            }}
            onExerciseParked={handleExerciseParked}
            onExerciseSkipped={handleExerciseSkipped}
            onSessionBoardOpened={openSessionBoard}
          />
        ) : null;

      case 'setInProgress':
        return plannedExercise ? (
          <SetInProgressPanel
            plannedExercise={plannedExercise}
            setNumber={machineState.currentSetNumber}
            onSetFinished={() => {
              sendEvent({ kind: 'setFinished' });
            }}
            onExerciseSkipped={handleExerciseSkipped}
          />
        ) : null;

      case 'loggingSet':
        return plannedExercise && setLogDraft ? (
          <SetLoggingPanel
            plannedExercise={plannedExercise}
            setLogDraft={setLogDraft}
            shouldSuggestGoingUpNow={shouldSuggestGoingUpForThisExercise(
              machineState.loggedExercises,
              plannedExercise,
            )}
            loadIncrementKilograms={resolveSmallestLoadIncrementKilograms(
              findExerciseById(plannedExercise.exerciseId)?.loadingStyle ?? 'unloaded',
            )}
            onDraftChanged={updateSetLogDraft}
            onSetLogged={logCurrentSet}
          />
        ) : null;

      case 'resting':
        return machineState.restStartedAt ? (
          <RestTimerPanel
            restStartedAt={machineState.restStartedAt}
            restTargetSeconds={machineState.restTargetSeconds}
            nextExercise={plannedExercise}
            isNextExerciseANewOne={machineState.doesRestLeadToANewExercise}
            nextSetNumber={machineState.currentSetNumber}
            coachLine={
              lastLoggedSet
                ? selectSetFeedbackLine(
                    lastLoggedSet.effortRating,
                    lastLoggedSet.didCauseSharpPain,
                    coachContext,
                  )
                : null
            }
            shouldPlaySound={shouldPlayRestTimerSound}
            onRestExtended={(extraSeconds) => {
              sendEvent({ kind: 'restExtended', extraSeconds });
            }}
            onRestFinished={() => {
              sendEvent({ kind: 'restFinished', occurredAt: new Date() });
            }}
            onNextExercisePreviewed={() => {
              setSessionOverlay({
                kind: 'exercisePreview',
                exerciseIndex: machineState.currentExerciseIndex,
                returnsToTheBoard: false,
              });
            }}
            onSessionBoardOpened={openSessionBoard}
          />
        ) : null;

      case 'sessionReview':
        return (
          <SessionReviewPanel
            loggedExercises={machineState.loggedExercises}
            overallFeeling={machineState.overallFeeling}
            sessionNotes={machineState.sessionNotes}
            onOverallFeelingChosen={(overallFeeling) => {
              sendEvent({ kind: 'overallFeelingChosen', overallFeeling });
            }}
            onSessionNotesEdited={(sessionNotes) => {
              sendEvent({ kind: 'sessionNotesEdited', sessionNotes });
            }}
            onSessionFinished={finishSession}
          />
        );

      case 'completed':
        return finishedSummary ? (
          <SessionSummaryPanel
            summary={finishedSummary}
            sessionDisplayName={plannedSession.displayName}
            coachLine={selectSessionCompletedLine(completedSessionCount + 1, coachContext)}
            saveErrorMessage={saveErrorMessage}
            onDonePressed={goHome}
          />
        ) : null;
    }
  };

  return (
    <main className={styles.screen}>
      <SessionHeaderBar
        sessionDisplayName={plannedSession.displayName}
        positionLabel={`Week ${String(plannedSession.weekNumber)} · ${plannedSession.phaseDisplayName}`}
        loggedSetCount={loggedSetCount}
        plannedSetCount={plannedSetCount}
        sessionStartedAt={sessionStartedAt}
        onSessionBoardOpened={openSessionBoard}
        onLeavePressed={() => {
          setIsLeaveSheetOpen(true);
        }}
      />

      <div className={styles.content}>
        {didResumeInterruptedSession && machineState.phase !== 'completed' ? (
          <GradientSurface variant="outlined" radius="large" className={styles.resumeNotice}>
            <p>Picked up where you left off. Everything you had already logged is still here.</p>
          </GradientSurface>
        ) : null}

        {machineState.phase === 'warmingUp' && deloadCoachLine ? (
          <GradientSurface variant="outlined" radius="large" className={styles.resumeNotice}>
            <p>{deloadCoachLine}</p>
          </GradientSurface>
        ) : null}

        {machineState.phase === 'warmingUp' && layoffCoachLine ? (
          <GradientSurface variant="outlined" radius="large" className={styles.resumeNotice}>
            <p>{layoffCoachLine}</p>
          </GradientSurface>
        ) : null}

        {machineState.phase === 'exerciseBrief' && machineState.currentExerciseIndex === 0 ? (
          <WarmupHandoverLine coachContext={coachContext} />
        ) : null}

        {renderCurrentPhase()}
      </div>

      {sessionOverlay.kind === 'board' ? (
        <SessionBoardOverlay
          sessionDisplayName={plannedSession.displayName}
          entries={sessionBoardEntries}
          onExercisePreviewed={(exerciseIndex) => {
            setSessionOverlay({
              kind: 'exercisePreview',
              exerciseIndex,
              returnsToTheBoard: true,
            });
          }}
          onClosed={closeSessionOverlay}
        />
      ) : null}

      {previewedBoardEntry && sessionOverlay.kind === 'exercisePreview' ? (
        <ExercisePreviewOverlay
          entry={previewedBoardEntry}
          backLabel={sessionOverlay.returnsToTheBoard ? 'All exercises' : 'Back to the rest'}
          onExerciseChosen={handleExerciseChosen}
          onClosed={() => {
            setSessionOverlay(
              sessionOverlay.returnsToTheBoard ? { kind: 'board' } : { kind: 'none' },
            );
          }}
        />
      ) : null}

      {isLeaveSheetOpen ? (
        <div className={styles.leaveOverlay} role="dialog" aria-modal="true">
          <GradientSurface variant="glass" radius="xlarge" className={styles.leaveSheet}>
            <h2 className={styles.leaveTitle}>Leave this session?</h2>
            <p className={styles.leaveMessage}>
              Everything you have logged is already saved. You can pick it up where you left off.
            </p>

            <GradientButton
              tone="secondary"
              isFullWidth
              onClick={() => {
                setIsLeaveSheetOpen(false);
              }}
            >
              Keep going
            </GradientButton>

            {machineState.phase !== 'sessionReview' && machineState.phase !== 'completed' ? (
              <GradientButton
                tone="primary"
                isFullWidth
                onClick={() => {
                  setIsLeaveSheetOpen(false);
                  sendEvent({ kind: 'sessionEndedEarly' });
                }}
              >
                Finish here instead
              </GradientButton>
            ) : null}

            <GradientButton tone="ghost" isFullWidth onClick={goHome}>
              Leave for now
            </GradientButton>
          </GradientSurface>
        </div>
      ) : null}
    </main>
  );
}

/**
 * The hand-over from the warm-up, shown once above the first brief.
 *
 * Its own component so that the line is chosen with its own rotation index —
 * the session's set counter would move it every set, and this is said once.
 */
function WarmupHandoverLine({ coachContext }: { coachContext: CoachContext }) {
  const line = selectWarmupFinishedLine({ ...coachContext, rotationIndex: 0 });

  return line ? <p className={styles.handoverLine}>{line}</p> : null;
}

/**
 * Whether to suggest going up now rather than waiting for next session.
 *
 * The rule is in docs/TRAINING_PROGRAM.md section 7 and the check is
 * `shouldSuggestImmediateLoadIncrease` in the domain layer; this only finds the
 * sets to hand it.
 */
function shouldSuggestGoingUpForThisExercise(
  loggedExercises: PerformedExercise[],
  plannedExercise: PlannedExercise | null,
): boolean {
  if (!plannedExercise || plannedExercise.prescription.kind !== 'weightAndReps') {
    return false;
  }

  const loggedExercise = loggedExercises.find(
    (candidate) => candidate.exerciseId === plannedExercise.exerciseId,
  );

  if (!loggedExercise) {
    return false;
  }

  /*
   * A stored `PerformedSet` carries everything a `PerformedSetRecord` does and
   * three fields progression has no use for, so it goes straight in.
   */
  return shouldSuggestImmediateLoadIncrease(
    loggedExercise.performedSets,
    plannedExercise.prescription.repRange,
  );
}
