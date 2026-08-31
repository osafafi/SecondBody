import { useCallback, useEffect, useState } from 'react';

import { readRecentBodyMetricEntries } from '@/services/repositories/bodyMetricsRepository';
import { readAllPersonalRecords } from '@/services/repositories/personalRecordsRepository';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import type { BodyMetricEntry } from '@/types/dailyTrackingTypes';
import type { PersonalRecord } from '@/types/trainingHistoryTypes';

/**
 * The two things the Progress screen needs that `useTrainingOverview` does not
 * already read: the scale, and the records.
 *
 * Deliberately not folded into `useTrainingOverview`. Today and Schedule open on
 * every launch and neither of them shows a weigh-in — adding two more Firestore
 * reads to the app's cold start so that a third screen could avoid a hook would
 * be the wrong trade. Sessions, the assignment and the settings still come from
 * the shared hook, exactly as PROGRESS.md asks.
 *
 * Feature-local rather than in `src/hooks/` because only this feature reads it.
 */

/** About four months of daily weigh-ins. More than any chart here draws. */
const RECENT_BODY_METRIC_COUNT = 120;

export type ProgressHistory = {
  /** Newest first, as the repository returns them. */
  bodyMetricEntries: BodyMetricEntry[];

  /** One per exercise ever trained, in no particular order. */
  personalRecords: PersonalRecord[];
};

export type ProgressHistoryStatus = 'loading' | 'ready' | 'failed';

export type ProgressHistoryState = {
  historyStatus: ProgressHistoryStatus;

  /** Non-null only when the status is `ready`. */
  progressHistory: ProgressHistory | null;

  historyErrorMessage: string | null;

  reloadProgressHistory: () => void;
};

/**
 * What one finished read produced, tagged with what it was a read *of*.
 *
 * The same shape and the same reasoning as `useTrainingOverview`: without the
 * tag there is a render where a new user's id is in context and the previous
 * user's records are still in state.
 */
type CompletedRead = {
  forUserId: string;
  forReloadCounter: number;

  status: 'ready' | 'failed';
  progressHistory: ProgressHistory | null;
  errorMessage: string | null;
};

/** Pass null while the signed-in user is not known yet; nothing is read. */
export function useProgressHistory(userId: string | null): ProgressHistoryState {
  const [completedRead, setCompletedRead] = useState<CompletedRead | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadProgressHistory = useCallback(() => {
    setReloadCounter((previousCounter) => previousCounter + 1);
  }, []);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let isCurrentRequest = true;

    const loadProgressHistory = async () => {
      try {
        const [bodyMetricEntries, personalRecords] = await Promise.all([
          readRecentBodyMetricEntries(userId, RECENT_BODY_METRIC_COUNT),
          readAllPersonalRecords(userId),
        ]);

        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'ready',
          errorMessage: null,
          progressHistory: { bodyMetricEntries, personalRecords },
        });
      } catch (error: unknown) {
        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'failed',
          progressHistory: null,
          errorMessage: describeRepositoryError(error),
        });
      }
    };

    void loadProgressHistory();

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, reloadCounter]);

  const isCompletedReadCurrent =
    completedRead !== null &&
    completedRead.forUserId === userId &&
    completedRead.forReloadCounter === reloadCounter;

  if (!isCompletedReadCurrent) {
    return {
      historyStatus: 'loading',
      progressHistory: null,
      historyErrorMessage: null,
      reloadProgressHistory,
    };
  }

  return {
    historyStatus: completedRead.status,
    progressHistory: completedRead.progressHistory,
    historyErrorMessage: completedRead.errorMessage,
    reloadProgressHistory,
  };
}
