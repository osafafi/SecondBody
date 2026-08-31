import { useCallback, useEffect, useState } from 'react';

import {
  defaultProgramTemplateId,
  findProgramTemplateById,
} from '@/content/programs/allProgramTemplates';
import { formatIsoDate } from '@/domain/calendarDates';
import {
  countCompletedSessions,
  findLastCompletedSessionAt,
} from '@/domain/exercisePerformanceHistory';
import { determineLayoffAdjustment, type LayoffAdjustment } from '@/domain/layoffRecovery';
import {
  createStartingProgramAssignment,
  resolveSessionStartPosition,
  type SessionStartPosition,
} from '@/domain/programAssignmentProgress';
import { calculateWholeDaysBetween } from '@/domain/sessionScheduling';
import { readActiveProgramAssignment } from '@/services/repositories/programAssignmentRepository';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import { readUserSettings } from '@/services/repositories/userSettingsRepository';
import { readRecentWorkoutSessions } from '@/services/repositories/workoutSessionRepository';
import type { ProgramTemplate } from '@/types/programTypes';
import type { ProgramAssignment, WorkoutSession } from '@/types/trainingHistoryTypes';
import type { UserSettings } from '@/types/userAccountTypes';

/**
 * Where the programme stands, read once and shared by both M6 screens.
 *
 * Today and Schedule ask overlapping questions — which session is next, how long
 * since the last one, how many are done — and answering them separately is how
 * two screens end up disagreeing about what week it is. So the reads and the
 * derivations happen here, and each screen decides only what to draw with them.
 *
 * **This hook never writes anything.** Two things it produces would normally be
 * written back, and deliberately are not:
 *
 * - When no assignment exists, it builds one for display and leaves it unsaved.
 *   Starting the programme is the session player's job, at the moment a session
 *   actually starts. A dashboard that quietly created an assignment because
 *   somebody opened the app would set the start date to the day he first looked
 *   at it.
 * - When a layoff sends the phase back to its first week, that is shown but not
 *   stored, for the same reason. `prepareSession` writes it when the session
 *   begins.
 *
 * `src/hooks/` rather than either feature, because features may not import from
 * each other — see CLAUDE.md section 3.
 */

/**
 * Enough history for the calendar's five weeks and for the layoff rules.
 *
 * At three sessions a week this is about three months, which is more than any
 * screen in M6 looks at. The bound is real rather than pagination in waiting.
 */
const RECENT_SESSION_COUNT = 40;

export type TrainingOverview = {
  /**
   * What the stored assignment says, or a starting one built for display when
   * the programme has not been started yet.
   */
  assignment: ProgramAssignment;

  /** True when the assignment above exists only in memory. */
  isAssignmentUnsaved: boolean;

  programTemplate: ProgramTemplate;

  /** Newest first, every status, as `readRecentWorkoutSessions` returns them. */
  recentSessions: WorkoutSession[];

  /** Null when nothing has ever been completed. */
  lastCompletedSessionAt: Date | null;

  /** All-time within the window read. Rations the coach's praise. */
  completedSessionCount: number;

  /** True when a session was started and never finished. */
  hasSessionInProgress: boolean;

  layoffAdjustment: LayoffAdjustment;

  /** Which week and letter the next session picks up on, after the layoff rule. */
  startPosition: SessionStartPosition;

  /**
   * Read here rather than by whichever screen needs it, so that a screen showing
   * a coach line does not need a second loading state to find out how much of
   * the coach he asked for.
   */
  userSettings: UserSettings;
};

export type TrainingOverviewStatus = 'loading' | 'ready' | 'failed';

export type TrainingOverviewState = {
  overviewStatus: TrainingOverviewStatus;

  /** Non-null only when the status is `ready`. */
  trainingOverview: TrainingOverview | null;

  /** A sentence to show, when the status is `failed`. */
  overviewErrorMessage: string | null;

  reloadTrainingOverview: () => void;
};

/** The programme a brand new account would be put on. */
function resolveDefaultProgramTemplate(): ProgramTemplate {
  const programTemplate = findProgramTemplateById(defaultProgramTemplateId);

  if (!programTemplate) {
    throw new Error('The default programme template is missing from this build.');
  }

  return programTemplate;
}

/**
 * What one finished read produced, tagged with what it was a read *of*.
 *
 * The tag is what makes "loading" a derived fact rather than a state somebody
 * has to remember to set. Without it there is a render where a new user's id is
 * in context and the previous user's programme is still in state — the same
 * trap `UserProfileProvider` avoids the same way, for the same reason. It also
 * keeps every `setState` behind an `await`, which is what
 * `react-hooks/set-state-in-effect` is asking for: a screen that flipped itself
 * to `loading` synchronously would render twice before Firestore had been asked
 * anything.
 */
type CompletedRead = {
  forUserId: string;
  forReloadCounter: number;

  status: 'ready' | 'failed';
  trainingOverview: TrainingOverview | null;
  errorMessage: string | null;
};

/**
 * Reads the assignment and the recent sessions, and derives the rest.
 *
 * Pass null while the signed-in user is not known yet; the hook stays in
 * `loading` and reads nothing.
 */
export function useTrainingOverview(userId: string | null): TrainingOverviewState {
  const [completedRead, setCompletedRead] = useState<CompletedRead | null>(null);

  /** Bumped to ask for a fresh read after a failure. */
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTrainingOverview = useCallback(() => {
    setReloadCounter((previousCounter) => previousCounter + 1);
  }, []);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    /*
     * A read that resolves after the user has changed, or after the screen has
     * gone, must not write into state. Both are real: signing out mid-read, and
     * navigating away from Today before Firestore answers.
     */
    let isCurrentRequest = true;

    const loadTrainingOverview = async () => {
      try {
        const [storedAssignment, recentSessions, userSettings] = await Promise.all([
          readActiveProgramAssignment(userId),
          readRecentWorkoutSessions(userId, RECENT_SESSION_COUNT),
          readUserSettings(userId),
        ]);

        if (!isCurrentRequest) {
          return;
        }

        const now = new Date();
        const programTemplate =
          (storedAssignment ? findProgramTemplateById(storedAssignment.programTemplateId) : null) ??
          resolveDefaultProgramTemplate();

        const assignment =
          storedAssignment ?? createStartingProgramAssignment(programTemplate, formatIsoDate(now));

        const lastCompletedSessionAt = findLastCompletedSessionAt(recentSessions);
        const layoffAdjustment = determineLayoffAdjustment(
          lastCompletedSessionAt === null
            ? null
            : calculateWholeDaysBetween(lastCompletedSessionAt, now),
        );

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'ready',
          errorMessage: null,
          trainingOverview: {
            assignment,
            isAssignmentUnsaved: storedAssignment === null,
            programTemplate,
            recentSessions,
            lastCompletedSessionAt,
            completedSessionCount: countCompletedSessions(recentSessions),
            /*
             * Taken from the sessions already read rather than from a second
             * query for the one in progress. The screens only need to know
             * whether there is one — which one it is belongs to the session
             * player, and it asks for that itself.
             */
            hasSessionInProgress: recentSessions.some((session) => session.status === 'inProgress'),
            layoffAdjustment,
            startPosition: resolveSessionStartPosition(
              assignment,
              programTemplate,
              layoffAdjustment,
            ),
            userSettings,
          },
        });
      } catch (error: unknown) {
        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'failed',
          trainingOverview: null,
          errorMessage: describeRepositoryError(error),
        });
      }
    };

    void loadTrainingOverview();

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, reloadCounter]);

  /*
   * Anything belonging to a different user, or to a read that has been asked to
   * happen again, simply does not count as loaded.
   */
  const isCompletedReadCurrent =
    completedRead !== null &&
    completedRead.forUserId === userId &&
    completedRead.forReloadCounter === reloadCounter;

  if (!isCompletedReadCurrent) {
    return {
      overviewStatus: 'loading',
      trainingOverview: null,
      overviewErrorMessage: null,
      reloadTrainingOverview,
    };
  }

  return {
    overviewStatus: completedRead.status,
    trainingOverview: completedRead.trainingOverview,
    overviewErrorMessage: completedRead.errorMessage,
    reloadTrainingOverview,
  };
}
