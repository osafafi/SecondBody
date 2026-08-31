import { useState } from 'react';
import { TrendingUp } from 'lucide-react';

import { useAuthentication } from '@/app/useAuthentication';
import { useUserProfile } from '@/app/useUserProfile';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { summariseBodyWeightTrend } from '@/domain/bodyWeightTrend';
import { countWholeWeeksSince, formatIsoDate } from '@/domain/calendarDates';
import {
  calculateTotalVolumeKilograms,
  compareLatestWeekToPrevious,
  findHeaviestWeek,
  groupTrainingVolumeByWeek,
} from '@/domain/trainingVolumeTrend';
import { useTrainingOverview, type TrainingOverview } from '@/hooks/useTrainingOverview';
import { addBodyMetricEntry } from '@/services/repositories/bodyMetricsRepository';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import type { BodyMetricEntry } from '@/types/dailyTrackingTypes';
import type { UserProfile } from '@/types/userAccountTypes';

import { BodyWeightTrendPanel } from './components/BodyWeightTrendPanel';
import { LogBodyWeightPanel } from './components/LogBodyWeightPanel';
import { PersonalRecordsPanel } from './components/PersonalRecordsPanel';
import { TrainingVolumePanel } from './components/TrainingVolumePanel';
import { resolveNamedPersonalRecords } from './personalRecordPresentation';
import { selectEarlyScaleCoachLine } from './progressCoachLines';
import styles from './ProgressScreen.module.css';
import { useProgressHistory, type ProgressHistory } from './useProgressHistory';

/**
 * The Progress screen: the scale, the work done, and the best each lift has been.
 *
 * Nothing here decides anything. `bodyWeightTrend.ts` decides what the scale is
 * doing, `trainingVolumeTrend.ts` buckets the sessions, and `progressWording.ts`
 * decides how each of those reads. This arranges what comes back.
 *
 * Two reads feed it: `useTrainingOverview` for the programme and the sessions,
 * which Today and Schedule already share, and `useProgressHistory` for the
 * weigh-ins and the records, which only this screen wants.
 */

/** Two months of weeks, which fits across a phone without the bars becoming lines. */
const VOLUME_WEEK_COUNT = 8;

/** Monday, matching the calendar in M6. */
const FIRST_DAY_OF_WEEK = 1;

export function ProgressScreen() {
  const { signedInUser } = useAuthentication();
  const { userProfile } = useUserProfile();

  const signedInUserId = signedInUser?.userId ?? null;

  const { overviewStatus, trainingOverview, overviewErrorMessage, reloadTrainingOverview } =
    useTrainingOverview(signedInUserId);

  const { historyStatus, progressHistory, historyErrorMessage, reloadProgressHistory } =
    useProgressHistory(signedInUserId);

  /*
   * Weigh-ins logged during this visit, newest first, kept alongside what was
   * read rather than written into it. Re-reading the collection after every save
   * would cost a round trip to redraw a line the app already knows the shape of.
   */
  const [locallyLoggedEntries, setLocallyLoggedEntries] = useState<BodyMetricEntry[]>([]);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const isLoading = overviewStatus === 'loading' || historyStatus === 'loading';
  const hasFailed = overviewStatus === 'failed' || historyStatus === 'failed';

  if (isLoading) {
    return (
      <>
        <ProgressScreenHeader />

        <div className={styles.body}>
          <GradientSurface variant="outlined" radius="xlarge" className={styles.pendingPanel}>
            <p className={styles.pendingLabel} role="status">
              Reading the numbers
            </p>
          </GradientSurface>
        </div>
      </>
    );
  }

  if (hasFailed || !trainingOverview || !progressHistory || !userProfile) {
    return (
      <>
        <ProgressScreenHeader />

        <div className={styles.body}>
          <GradientSurface variant="outlined" radius="xlarge" className={styles.errorPanel}>
            <h2 className={styles.errorTitle}>Could not read your progress</h2>

            {(overviewErrorMessage ?? historyErrorMessage) ? (
              <p className={styles.errorMessage} role="alert">
                {overviewErrorMessage ?? historyErrorMessage}
              </p>
            ) : null}

            <GradientButton
              tone="primary"
              isFullWidth
              onClick={() => {
                reloadTrainingOverview();
                reloadProgressHistory();
              }}
            >
              Try again
            </GradientButton>
          </GradientSurface>
        </div>
      </>
    );
  }

  const handleWeightLogged = (weightKilograms: number) => {
    if (signedInUserId === null || isSavingWeight) {
      return;
    }

    const entry: BodyMetricEntry = {
      recordedOn: formatIsoDate(new Date()),
      weightKilograms,
      waistCentimetres: null,
      chestCentimetres: null,
      hipsCentimetres: null,
      notes: null,
      createdAt: new Date(),
    };

    setIsSavingWeight(true);
    setSaveErrorMessage(null);

    const { createdAt: _createdAt, ...entryToWrite } = entry;

    void addBodyMetricEntry(signedInUserId, entryToWrite)
      .then(() => {
        setLocallyLoggedEntries((previousEntries) => [entry, ...previousEntries]);
        setIsSavingWeight(false);
      })
      .catch((error: unknown) => {
        setIsSavingWeight(false);
        setSaveErrorMessage(describeRepositoryError(error));
      });
  };

  return (
    <>
      <ProgressScreenHeader />

      <ProgressBody
        trainingOverview={trainingOverview}
        progressHistory={progressHistory}
        locallyLoggedEntries={locallyLoggedEntries}
        userProfile={userProfile}
        isSavingWeight={isSavingWeight}
        saveErrorMessage={saveErrorMessage}
        onWeightLogged={handleWeightLogged}
      />
    </>
  );
}

function ProgressScreenHeader() {
  return (
    <ScreenHeader
      title="Progress"
      subtitle="The numbers that matter"
      leadingSlot={<IconBadge icon={<TrendingUp size={22} strokeWidth={1.75} />} isSolid />}
    />
  );
}

/**
 * Everything below the header, once there is something real to draw.
 *
 * Its own component so the screen above stays a list of states — loading, failed,
 * ready — rather than a state machine with three charts tangled through it. The
 * same split as `TodayScreen`, for the same reason.
 */
function ProgressBody({
  trainingOverview,
  progressHistory,
  locallyLoggedEntries,
  userProfile,
  isSavingWeight,
  saveErrorMessage,
  onWeightLogged,
}: {
  trainingOverview: TrainingOverview;
  progressHistory: ProgressHistory;
  locallyLoggedEntries: readonly BodyMetricEntry[];
  userProfile: UserProfile;
  isSavingWeight: boolean;
  saveErrorMessage: string | null;
  onWeightLogged: (weightKilograms: number) => void;
}) {
  /*
   * One reading of the clock for the whole screen, for the same reason Today
   * takes one: the volume weeks, the "today" in the log panel and the weeks
   * elapsed all have to agree about what day it is.
   */
  const now = new Date();
  const today = formatIsoDate(now);

  const { assignment, recentSessions, completedSessionCount, userSettings } = trainingOverview;

  const allBodyMetricEntries = [...locallyLoggedEntries, ...progressHistory.bodyMetricEntries];

  const trendSummary = summariseBodyWeightTrend({
    observations: allBodyMetricEntries.flatMap((entry) =>
      entry.weightKilograms === null
        ? []
        : [{ onDate: entry.recordedOn, weightKilograms: entry.weightKilograms }],
    ),
    startingWeightKilograms: userProfile.startingWeightKilograms,
    targetWeightKilograms: userProfile.targetWeightKilograms,
    weeksElapsed: countWholeWeeksSince(assignment.startedOn, now),
  });

  const volumeWeeks = groupTrainingVolumeByWeek({
    completedSessions: recentSessions.flatMap((session) =>
      session.status === 'completed' && session.completedAt !== null
        ? [
            {
              completedAt: session.completedAt,
              totalVolumeKilograms: session.totalVolumeKilograms,
            },
          ]
        : [],
    ),
    now,
    weekCount: VOLUME_WEEK_COUNT,
    firstDayOfWeek: FIRST_DAY_OF_WEEK,
  });

  const namedRecords = resolveNamedPersonalRecords(progressHistory.personalRecords);

  const earlyScaleCoachLine = selectEarlyScaleCoachLine({
    currentWeekNumber: assignment.currentWeekNumber,
    configuredVerbosity: userSettings.coachVerbosity,
    /*
     * Moves with the sessions completed and with the weigh-ins logged, so the
     * line rotates over a week where only one of the two is happening.
     */
    rotationIndex: completedSessionCount + allBodyMetricEntries.length,
  });

  return (
    <div className={styles.body}>
      <BodyWeightTrendPanel trendSummary={trendSummary} earlyScaleCoachLine={earlyScaleCoachLine} />

      <LogBodyWeightPanel
        startingWeightKilograms={
          trendSummary.latestRecordedWeightKilograms ?? userProfile.startingWeightKilograms
        }
        hasWeighedInToday={allBodyMetricEntries.some((entry) => entry.recordedOn === today)}
        isSaving={isSavingWeight}
        saveErrorMessage={saveErrorMessage}
        onWeightLogged={onWeightLogged}
      />

      <TrainingVolumePanel
        weeks={volumeWeeks}
        comparison={compareLatestWeekToPrevious(volumeWeeks)}
        heaviestWeek={findHeaviestWeek(volumeWeeks)}
        totalVolumeKilograms={calculateTotalVolumeKilograms(volumeWeeks)}
      />

      <PersonalRecordsPanel records={namedRecords} />
    </div>
  );
}
