import { useCallback, useEffect, useState } from 'react';

import { nightlySleepTargetHours, stepCountTargets } from '@/content/habits/dailyHabitDefinitions';
import { countWholeWeeksSince, parseIsoDate } from '@/domain/calendarDates';
import { buildRecentHabitDays, type HabitDay } from '@/domain/habitCompliance';
import { calculateDailyStepTarget } from '@/domain/habitTargets';
import {
  addBodyMetricEntry,
  readRecentBodyMetricEntries,
} from '@/services/repositories/bodyMetricsRepository';
import {
  readRecentDailyHabitRecords,
  writeDailyHabitRecord,
} from '@/services/repositories/dailyHabitsRepository';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import {
  buildEmptyDailyHabitRecord,
  type BodyMetricEntry,
  type DailyHabitRecord,
} from '@/types/dailyTrackingTypes';

/**
 * The two things the Today screen writes: the daily checklist, and the scale.
 *
 * One hook rather than two, because they land on the same screen and two
 * independent loading states there would mean two panels appearing at different
 * moments on every launch. They are read in one `Promise.all` and reported
 * through one status.
 *
 * Deliberately separate from `useTrainingOverview`, which Today and Schedule
 * share: the Schedule screen shows no habits and no weigh-in, and folding these
 * reads into the shared hook would make every screen pay for them.
 */

/**
 * How much habit history is read on launch.
 *
 * A month, which covers the seven-day compliance figure with room to spare and
 * bounds the streak: a run longer than this reads as exactly this, which is a
 * pleasant problem and a documented one. Thirty small documents on a screen that
 * opens once or twice a day is well inside the cost note in
 * docs/DATA_MODEL.md section 6.
 */
const RECENT_HABIT_DAY_COUNT = 30;

/** Only the latest weigh-in is needed here, to prefill the stepper. */
const RECENT_BODY_METRIC_COUNT = 1;

export type TodayTrackingStatus = 'loading' | 'ready' | 'failed';

export type TodayTracking = {
  /** Today's checklist. A blank record when nothing has been ticked yet. */
  todayHabitRecord: DailyHabitRecord;

  /**
   * The recent **calendar** days, newest first and including today, each with
   * the targets that were in force on it. Days nothing was recorded for are
   * present as blanks — see `buildRecentHabitDays`.
   */
  recentHabitDays: HabitDay[];

  /** Today's step target, which climbs across the twelve weeks. */
  dailyStepTarget: number;

  /** The most recent weigh-in, or null if the scale has never been used. */
  latestBodyMetricEntry: BodyMetricEntry | null;
};

export type TodayTrackingState = {
  trackingStatus: TodayTrackingStatus;

  /** Non-null only when the status is `ready`. */
  todayTracking: TodayTracking | null;

  trackingErrorMessage: string | null;

  /** True while a tick or a weigh-in is on its way to Firestore. */
  isSavingTracking: boolean;

  /** Set when a write failed. The optimistic change is rolled back with it. */
  saveErrorMessage: string | null;

  /**
   * Bumped once per weigh-in that actually landed.
   *
   * The quick log panel is keyed on it, so a successful save folds the panel
   * shut by remounting it. A counter rather than the reload counter, which also
   * moves when somebody retries a failed read and should not close anything.
   */
  completedWeighInCount: number;

  reloadTodayTracking: () => void;

  /** Ticks a box or answers a number, and saves the whole day merged. */
  recordHabitAnswer: (changes: Partial<Omit<DailyHabitRecord, 'onDate' | 'updatedAt'>>) => void;

  recordBodyWeight: (weightKilograms: number) => void;
};

export type TodayTrackingInput = {
  /** Null while the signed-in user is not known yet; nothing is read. */
  userId: string | null;

  /** Today, as the screen read the clock once. */
  todayIsoDate: string;

  /** Where the programme started, which is what turns a date into a week number. */
  programmeStartedOn: string;

  totalWeekCount: number;
};

/**
 * What one finished read produced, tagged with what it was a read *of*.
 *
 * The same shape and the same reasoning as `useTrainingOverview`: without the
 * tag there is a render where a new user's id is in context and the previous
 * user's checklist is still on screen.
 */
type CompletedRead = {
  forUserId: string;
  forReloadCounter: number;

  status: 'ready' | 'failed';
  habitRecords: DailyHabitRecord[];
  latestBodyMetricEntry: BodyMetricEntry | null;
  errorMessage: string | null;
};

export function useTodayTracking(input: TodayTrackingInput): TodayTrackingState {
  const { userId, todayIsoDate, programmeStartedOn, totalWeekCount } = input;

  const [completedRead, setCompletedRead] = useState<CompletedRead | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [completedWeighInCount, setCompletedWeighInCount] = useState(0);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const reloadTodayTracking = useCallback(() => {
    setSaveErrorMessage(null);
    setReloadCounter((previousCounter) => previousCounter + 1);
  }, []);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    /*
     * A read that resolves after the user has changed, or after the screen has
     * gone, must not write into state.
     */
    let isCurrentRequest = true;

    const loadTodayTracking = async () => {
      try {
        const [habitRecords, bodyMetricEntries] = await Promise.all([
          readRecentDailyHabitRecords(userId, RECENT_HABIT_DAY_COUNT),
          readRecentBodyMetricEntries(userId, RECENT_BODY_METRIC_COUNT),
        ]);

        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'ready',
          habitRecords,
          latestBodyMetricEntry: bodyMetricEntries[0] ?? null,
          errorMessage: null,
        });
      } catch (error: unknown) {
        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'failed',
          habitRecords: [],
          latestBodyMetricEntry: null,
          errorMessage: describeRepositoryError(error),
        });
      }
    };

    void loadTodayTracking();

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, reloadCounter]);

  /**
   * The step target that was being asked for on a given day.
   *
   * Recalculated per day rather than applied as one number to the whole window,
   * because the target climbs — see the note at the top of
   * `src/domain/habitCompliance.ts`.
   */
  const resolveDailyStepTargetFor = useCallback(
    (isoDate: string): number =>
      calculateDailyStepTarget({
        weekNumber: countWholeWeeksSince(programmeStartedOn, parseIsoDate(isoDate)) + 1,
        totalWeekCount,
        ...stepCountTargets,
      }),
    [programmeStartedOn, totalWeekCount],
  );

  const isCompletedReadCurrent =
    completedRead !== null &&
    completedRead.forUserId === userId &&
    completedRead.forReloadCounter === reloadCounter;

  /**
   * Saves the day the user just changed, and puts it on screen before Firestore
   * has answered.
   *
   * Optimistic, because a checkbox that waits for a round trip before it looks
   * ticked gets pressed twice. A failed write rolls the change back rather than
   * leaving a tick on screen that nothing recorded — a checklist that lies about
   * what was saved is worse than one that says it could not save.
   */
  const recordHabitAnswer = useCallback(
    (changes: Partial<Omit<DailyHabitRecord, 'onDate' | 'updatedAt'>>) => {
      if (userId === null || !isCompletedReadCurrent || completedRead.status !== 'ready') {
        return;
      }

      const previousRead = completedRead;

      const currentTodayRecord =
        previousRead.habitRecords.find((record) => record.onDate === todayIsoDate) ??
        buildEmptyDailyHabitRecord(todayIsoDate, new Date());

      const updatedTodayRecord: DailyHabitRecord = { ...currentTodayRecord, ...changes };

      setSaveErrorMessage(null);
      setIsSavingTracking(true);
      setCompletedRead({
        ...previousRead,
        habitRecords: [
          updatedTodayRecord,
          ...previousRead.habitRecords.filter((record) => record.onDate !== todayIsoDate),
        ],
      });

      /*
       * `updatedAt` is left off: the repository writes a server timestamp for
       * it, which is the only clock in this app that two devices agree on.
       */
      void writeDailyHabitRecord(userId, {
        onDate: updatedTodayRecord.onDate,
        didHitProteinTarget: updatedTodayRecord.didHitProteinTarget,
        didAvoidLiquidCalories: updatedTodayRecord.didAvoidLiquidCalories,
        didCompleteMobilityRoutine: updatedTodayRecord.didCompleteMobilityRoutine,
        stepCount: updatedTodayRecord.stepCount,
        sleepHours: updatedTodayRecord.sleepHours,
      })
        .catch((error: unknown) => {
          setSaveErrorMessage(describeRepositoryError(error));
          setCompletedRead(previousRead);
        })
        .finally(() => {
          setIsSavingTracking(false);
        });
    },
    [userId, todayIsoDate, completedRead, isCompletedReadCurrent],
  );

  /**
   * Appends a weigh-in.
   *
   * Not optimistic. A weight is added rather than toggled, the panel has a
   * saving state of its own, and showing a reading that Firestore rejected would
   * put a number on the trend that is not in the collection the trend is drawn
   * from.
   */
  const recordBodyWeight = useCallback(
    (weightKilograms: number) => {
      if (userId === null) {
        return;
      }

      setSaveErrorMessage(null);
      setIsSavingTracking(true);

      void addBodyMetricEntry(userId, {
        recordedOn: todayIsoDate,
        weightKilograms,
        waistCentimetres: null,
        chestCentimetres: null,
        hipsCentimetres: null,
        notes: null,
      })
        .then(() => {
          // Read again, so the panel shows the entry that actually landed.
          setCompletedWeighInCount((previousCount) => previousCount + 1);
          setReloadCounter((previousCounter) => previousCounter + 1);
        })
        .catch((error: unknown) => {
          setSaveErrorMessage(describeRepositoryError(error));
        })
        .finally(() => {
          setIsSavingTracking(false);
        });
    },
    [userId, todayIsoDate],
  );

  if (!isCompletedReadCurrent) {
    return {
      trackingStatus: 'loading',
      todayTracking: null,
      trackingErrorMessage: null,
      isSavingTracking,
      saveErrorMessage,
      completedWeighInCount,
      reloadTodayTracking,
      recordHabitAnswer,
      recordBodyWeight,
    };
  }

  const todayHabitRecord =
    completedRead.habitRecords.find((record) => record.onDate === todayIsoDate) ??
    buildEmptyDailyHabitRecord(todayIsoDate, new Date());

  return {
    trackingStatus: completedRead.status,
    todayTracking:
      completedRead.status === 'ready'
        ? {
            todayHabitRecord,
            recentHabitDays: buildRecentHabitDays({
              records: completedRead.habitRecords,
              todayIsoDate,
              /*
               * Nothing before the programme started counts. A checklist opened
               * on day three should not report a week that mostly predates the
               * app.
               */
              earliestIsoDate: programmeStartedOn,
              maximumDayCount: RECENT_HABIT_DAY_COUNT,
              resolveDailyStepTarget: resolveDailyStepTargetFor,
              nightlySleepTargetHours,
            }),
            dailyStepTarget: resolveDailyStepTargetFor(todayIsoDate),
            latestBodyMetricEntry: completedRead.latestBodyMetricEntry,
          }
        : null,
    trackingErrorMessage: completedRead.errorMessage,
    isSavingTracking,
    saveErrorMessage,
    completedWeighInCount,
    reloadTodayTracking,
    recordHabitAnswer,
    recordBodyWeight,
  };
}
