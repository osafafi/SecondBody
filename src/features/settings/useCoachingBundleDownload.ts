import { useCallback, useState } from 'react';

import { findCoachingContentFacts } from '@/content/coaching/coachingContentFacts';
import { buildCoachingBundleFileName, formatCoachingBundleAsJson } from '@/domain/coachingBundle';
import {
  assembleCoachingBundle,
  COACHING_BUNDLE_FIRST_DAY_OF_WEEK,
  COACHING_EXPORT_LIMITS,
} from '@/domain/coachingBundleAssembly';
import { readRecentBodyMetricEntries } from '@/services/repositories/bodyMetricsRepository';
import { readRecentDailyHabitRecords } from '@/services/repositories/dailyHabitsRepository';
import { readRecentJournalEntries } from '@/services/repositories/journalEntriesRepository';
import { readAllPersonalRecords } from '@/services/repositories/personalRecordsRepository';
import { readActiveProgramAssignment } from '@/services/repositories/programAssignmentRepository';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import { readRecentWorkoutSessions } from '@/services/repositories/workoutSessionRepository';
import type { UserProfile } from '@/types/userAccountTypes';

import { saveTextFileToDevice } from './saveTextFileToDevice';

/**
 * The coaching bundle, from the phone.
 *
 * The other way of getting one is `npm run coach:export`, which reads the same
 * collections with `firebase-admin` and writes to `.coaching/`. Both hand what
 * they read to `assembleCoachingBundle`, and both ask
 * `findCoachingContentFacts` for the content half, so the two files are
 * identical — see the note at the top of that module.
 *
 * This one exists because the laptop is not always where the phone is. Same
 * data, two taps, into whatever the browser calls the downloads folder.
 */

export type CoachingBundleDownloadStatus = 'idle' | 'preparing' | 'ready' | 'failed';

export type CoachingBundleDownloadState = {
  downloadStatus: CoachingBundleDownloadStatus;

  /** Set when the read or the write failed. */
  downloadErrorMessage: string | null;

  /** The name of the file that was just handed to the browser, or null. */
  downloadedFileName: string | null;

  downloadCoachingBundle: () => void;
};

/** Pass null while the signed-in user or the profile is not known yet. */
export function useCoachingBundleDownload(
  userId: string | null,
  userProfile: UserProfile | null,
): CoachingBundleDownloadState {
  const [downloadStatus, setDownloadStatus] = useState<CoachingBundleDownloadStatus>('idle');
  const [downloadErrorMessage, setDownloadErrorMessage] = useState<string | null>(null);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);

  const downloadCoachingBundle = useCallback(() => {
    if (userId === null || userProfile === null) {
      return;
    }

    setDownloadStatus('preparing');
    setDownloadErrorMessage(null);

    const buildAndSaveBundle = async () => {
      try {
        /*
         * Six reads in parallel. This is the most expensive thing the app does,
         * and it happens because somebody asked for it rather than because a
         * screen opened — which is why the windows are generous. Even at these
         * limits it is a few hundred documents against a daily allowance of
         * fifty thousand; see docs/DATA_MODEL.md section 6.
         */
        const [
          assignment,
          sessions,
          bodyMetricEntries,
          habitRecords,
          personalRecords,
          journalEntries,
        ] = await Promise.all([
          readActiveProgramAssignment(userId),
          readRecentWorkoutSessions(userId, COACHING_EXPORT_LIMITS.sessionCount),
          readRecentBodyMetricEntries(userId, COACHING_EXPORT_LIMITS.bodyMetricEntryCount),
          readRecentDailyHabitRecords(userId, COACHING_EXPORT_LIMITS.habitDayCount),
          readAllPersonalRecords(userId),
          readRecentJournalEntries(userId, COACHING_EXPORT_LIMITS.journalEntryCount),
        ]);

        const contentFacts = findCoachingContentFacts(assignment?.programTemplateId ?? null);

        if (contentFacts === null) {
          /*
           * The stored assignment names a programme this build does not have,
           * which means the data and the shipped content have gone out of step.
           * Saying so beats exporting a bundle built from a substituted
           * template that nobody would notice inside the file.
           */
          setDownloadStatus('failed');
          setDownloadErrorMessage(
            `Your programme is "${assignment?.programTemplateId ?? ''}", which this version of the app does not have. That is a bug worth reporting.`,
          );

          return;
        }

        const generatedAt = new Date();

        const bundle = assembleCoachingBundle({
          generatedAt,
          storedData: {
            profile: userProfile,
            assignment,
            sessions,
            bodyMetricEntries,
            habitRecords,
            personalRecords,
            journalEntries,
          },
          contentFacts,
          firstDayOfWeek: COACHING_BUNDLE_FIRST_DAY_OF_WEEK,
          maximumHabitDayCount: COACHING_EXPORT_LIMITS.habitDayCount,
        });

        const fileName = buildCoachingBundleFileName(generatedAt);

        saveTextFileToDevice(fileName, formatCoachingBundleAsJson(bundle));

        setDownloadedFileName(fileName);
        setDownloadStatus('ready');
      } catch (error: unknown) {
        setDownloadStatus('failed');
        setDownloadErrorMessage(describeRepositoryError(error));
      }
    };

    void buildAndSaveBundle();
  }, [userId, userProfile]);

  return {
    downloadStatus,
    downloadErrorMessage,
    downloadedFileName,
    downloadCoachingBundle,
  };
}
