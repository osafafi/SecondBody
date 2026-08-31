import { CalendarHeart, Dumbbell } from 'lucide-react';

import { useAuthentication } from '@/app/useAuthentication';
import { useUserProfile } from '@/app/useUserProfile';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { findCoachLinesByCategory } from '@/content/coachVoice/allCoachLines';
import { nightlySleepTargetHours } from '@/content/habits/dailyHabitDefinitions';
import {
  findMobilityRoutineById,
  dailyMobilityRoutineId,
} from '@/content/mobility/allMobilityRoutines';
import { formatIsoDate } from '@/domain/calendarDates';
import { selectCoachLine } from '@/domain/coachLineSelection';
import {
  canStartSessionFromTodayScreen,
  determineDailyTrainingStatus,
} from '@/domain/dailyTrainingStatus';
import {
  countCurrentHabitStreak,
  summariseDailyHabits,
  summariseRecentHabitCompliance,
} from '@/domain/habitCompliance';
import { isFirstSessionOfPhase } from '@/domain/programProgressSummary';
import { buildTrainingCalendar, countMissedTrainingDays } from '@/domain/trainingCalendar';
import { useTrainingOverview, type TrainingOverview } from '@/hooks/useTrainingOverview';
import type { CoachVerbosityLevel } from '@/types/coachVoiceTypes';
import type { UserProfile } from '@/types/userAccountTypes';

import { DailyCoachNote } from './components/DailyCoachNote';
import { DailyHabitChecklistPanel } from './components/DailyHabitChecklistPanel';
import { QuickWeightLogPanel } from './components/QuickWeightLogPanel';
import { RestDayMobilityNote } from './components/RestDayMobilityNote';
import { TodaySessionPanel } from './components/TodaySessionPanel';
import { selectDailyCoachLine } from './dashboardCoachLines';
import { resolveDueSessionOutline } from './dueSessionOutline';
import styles from './TodayScreen.module.css';
import { formatFullDate } from './todayWording';
import { useTodayTracking } from './useTodayTracking';

/**
 * The window the "x of the last y days" line is measured over.
 *
 * A week, because that is the unit a training week is planned in and because a
 * month of history makes a bad Tuesday invisible — which sounds kind and is
 * actually just less useful.
 */
const DAYS_IN_THE_COMPLIANCE_WINDOW = 7;

/**
 * The screen the app opens on: what is on today, and the way into it.
 *
 * M5 left a placeholder here — a card with a link to `#/session` and no idea
 * whether a session was due. This is what replaces it. The screen itself decides
 * almost nothing: `determineDailyTrainingStatus` decides the stance,
 * `selectDailyCoachMoment` decides whether Harout has anything to say, and this
 * arranges what comes back.
 *
 * **The clock is read once, here, and passed down.** Every relative date on the
 * screen — "tomorrow", "in 11 hours", "today" — has to agree, and three
 * components each calling `new Date()` is how one of them ends up a day out at
 * one minute to midnight.
 */
export function TodayScreen() {
  const { signedInUser } = useAuthentication();
  const { userProfile } = useUserProfile();

  const signedInUserId = signedInUser?.userId ?? null;

  const { overviewStatus, trainingOverview, overviewErrorMessage, reloadTrainingOverview } =
    useTrainingOverview(signedInUserId);

  /*
   * One reading of the clock for the whole screen. Not a ticking one — nothing
   * here counts down by the second, and re-rendering every second to move a
   * figure that changes hourly would spend battery on nothing. `useCurrentTime`
   * is for the rest timer, where the seconds are the point.
   */
  const now = new Date();

  /*
   * The header stays put while the programme is read, and the briefing fills in
   * under it. `PendingScreen` is the whole-display version used by the gates in
   * `src/app/`; inside the shell it would be a full viewport of nothing with a
   * bottom navigation floating over it.
   */
  if (overviewStatus === 'loading') {
    return (
      <>
        <TodayScreenHeader now={now} />

        <div className={styles.body}>
          <GradientSurface variant="outlined" radius="xlarge" className={styles.pendingPanel}>
            <p className={styles.pendingLabel} role="status">
              Working out what is on today
            </p>
          </GradientSurface>
        </div>
      </>
    );
  }

  if (overviewStatus === 'failed' || !trainingOverview || !userProfile) {
    return (
      <>
        <TodayScreenHeader now={now} />

        <div className={styles.body}>
          <GradientSurface variant="outlined" radius="xlarge" className={styles.errorPanel}>
            <h2 className={styles.errorTitle}>Could not read your programme</h2>

            {overviewErrorMessage ? (
              <p className={styles.errorMessage} role="alert">
                {overviewErrorMessage}
              </p>
            ) : null}

            <GradientButton tone="primary" isFullWidth onClick={reloadTrainingOverview}>
              Try again
            </GradientButton>
          </GradientSurface>
        </div>
      </>
    );
  }

  return (
    <>
      <TodayScreenHeader now={now} />
      <TodayBriefing now={now} trainingOverview={trainingOverview} userProfile={userProfile} />
    </>
  );
}

function TodayScreenHeader({ now }: { now: Date }) {
  return (
    <ScreenHeader
      title="Today"
      subtitle={formatFullDate(now)}
      leadingSlot={<IconBadge icon={<Dumbbell size={22} strokeWidth={1.75} />} isSolid />}
    />
  );
}

/**
 * Everything below the header, once there is something real to draw.
 *
 * Its own component so that the screen above stays a list of states — loading,
 * failed, ready — rather than a state machine with a briefing tangled through
 * it.
 */
function TodayBriefing({
  now,
  trainingOverview,
  userProfile,
}: {
  now: Date;
  trainingOverview: TrainingOverview;
  userProfile: UserProfile;
}) {
  const {
    assignment,
    programTemplate,
    recentSessions,
    lastCompletedSessionAt,
    completedSessionCount,
    hasSessionInProgress,
    layoffAdjustment,
    startPosition,
    userSettings,
  } = trainingOverview;

  const trainingStatus = determineDailyTrainingStatus({
    now,
    trainingDaysOfWeek: userProfile.trainingDaysOfWeek,
    lastCompletedSessionAt,
    minimumHoursBetweenSessions: programTemplate.minimumHoursBetweenSessions,
    hasSessionInProgress,
    isProgrammeFinished: assignment.status === 'completed',
  });

  const dueSession = resolveDueSessionOutline({
    programTemplate,
    weekNumber: startPosition.weekNumber,
    sessionLetter: startPosition.sessionLetter,
    activePainAreas: userProfile.painAreas,
    excludedExerciseIds: userProfile.excludedExerciseIds,
  });

  /*
   * A fortnight of the calendar, purely to find out whether a planned day went
   * by unused. It is the one thing the coach's ranking needs that neither the
   * assignment nor the session history says on its own — a missed Wednesday
   * leaves no record of itself anywhere.
   */
  const missedTrainingDayCount = countMissedTrainingDays(
    buildTrainingCalendar({
      now,
      weeksBeforeToday: 1,
      weeksAfterToday: 0,
      firstDayOfWeek: 1,
      trainingDaysOfWeek: userProfile.trainingDaysOfWeek,
      recentSessions,
      nextSessionLetter: startPosition.sessionLetter,
      programmeStartedOn: assignment.startedOn,
    }),
  );

  const coachLine = selectDailyCoachLine({
    stance: trainingStatus.stance,
    isReturningFromLayoff: layoffAdjustment.isReturningFromLayoff,
    hasMissedAPlannedSession: missedTrainingDayCount > 0,
    isDeloadWeekDue: dueSession?.isDeloadWeek ?? false,
    isFirstSessionOfPhaseDue: isFirstSessionOfPhase(
      programTemplate,
      startPosition.weekNumber,
      startPosition.sessionLetter,
    ),
    currentWeekNumber: startPosition.weekNumber,
    configuredVerbosity: userSettings.coachVerbosity,
    /*
     * Moves with the sessions completed and with the days since the last one,
     * so the line rotates over a quiet week as well as over a busy one.
     */
    rotationIndex: completedSessionCount + layoffAdjustment.daysSinceLastSession,
  });

  const dailyMobilityRoutine = findMobilityRoutineById(dailyMobilityRoutineId);

  return (
    <div className={styles.body}>
      {dueSession ? (
        <TodaySessionPanel
          stance={trainingStatus.stance}
          now={now}
          sessionLetter={dueSession.sessionLetter}
          sessionDisplayName={dueSession.displayName}
          sessionSummary={dueSession.summary}
          weekNumber={dueSession.weekNumber}
          totalWeekCount={dueSession.totalWeekCount}
          phaseDisplayName={dueSession.phaseDisplayName}
          isDeloadWeek={dueSession.isDeloadWeek}
          isCalibrationWeek={dueSession.isCalibrationWeek}
          movementNames={dueSession.movementNames}
          canStartSession={canStartSessionFromTodayScreen(trainingStatus)}
          hoursUntilAllowed={trainingStatus.hoursUntilAllowed}
          earliestNextSessionAt={trainingStatus.earliestNextSessionAt}
          nextAvailableTrainingDate={trainingStatus.nextAvailableTrainingDate}
          daysSinceLastSession={trainingStatus.daysSinceLastSession}
        />
      ) : (
        /*
         * Only reachable if the assignment names a week the programme does not
         * have, which means stored data and shipped content have gone out of
         * step. Saying so beats rendering an empty card.
         */
        <GradientSurface variant="outlined" radius="xlarge" className={styles.errorPanel}>
          <h2 className={styles.errorTitle}>This session is not in the app</h2>
          <p className={styles.errorMessage}>
            Your programme is on week {startPosition.weekNumber}, session{' '}
            {startPosition.sessionLetter}, which this version does not have. That is a bug worth
            reporting.
          </p>
        </GradientSurface>
      )}

      <DailyCoachNote coachLine={coachLine} />

      {trainingStatus.stance === 'restDay' && dailyMobilityRoutine ? (
        <RestDayMobilityNote mobilityRoutine={dailyMobilityRoutine} />
      ) : null}

      <TodayTrackingSection
        now={now}
        programmeStartedOn={assignment.startedOn}
        totalWeekCount={programTemplate.totalWeekCount}
        fallbackWeightKilograms={userProfile.startingWeightKilograms}
        configuredVerbosity={userSettings.coachVerbosity}
      />

      <p className={styles.scheduleHint}>
        <CalendarHeart size={14} strokeWidth={2} aria-hidden />
        The Schedule tab has the calendar and where the twelve weeks have got to.
      </p>
    </div>
  );
}

/**
 * The two things Today writes: the daily checklist, and the scale.
 *
 * Its own component so that its reads have their own loading state. The session
 * panel above is the reason the app was opened and must not wait on a checklist
 * — and this is also what keeps the note at the top of `useTrainingOverview`
 * true, that Today writes nothing except when it is actually asked to.
 *
 * Nothing here is decided locally: `habitCompliance.ts` says what was met, what
 * the streak is and how the last stretch went, and this arranges the answers.
 */
function TodayTrackingSection({
  now,
  programmeStartedOn,
  totalWeekCount,
  fallbackWeightKilograms,
  configuredVerbosity,
}: {
  now: Date;
  programmeStartedOn: string;
  totalWeekCount: number;

  /** What the stepper opens on before the scale has ever been used. */
  fallbackWeightKilograms: number;

  configuredVerbosity: CoachVerbosityLevel;
}) {
  const { signedInUser } = useAuthentication();
  const todayIsoDate = formatIsoDate(now);

  const {
    trackingStatus,
    todayTracking,
    trackingErrorMessage,
    isSavingTracking,
    saveErrorMessage,
    completedWeighInCount,
    reloadTodayTracking,
    recordHabitAnswer,
    recordBodyWeight,
  } = useTodayTracking({
    userId: signedInUser?.userId ?? null,
    todayIsoDate,
    programmeStartedOn,
    totalWeekCount,
  });

  if (trackingStatus === 'loading') {
    return (
      <GradientSurface variant="outlined" radius="xlarge" className={styles.pendingPanel}>
        <p className={styles.pendingLabel} role="status">
          Reading today&rsquo;s habits
        </p>
      </GradientSurface>
    );
  }

  if (trackingStatus === 'failed' || !todayTracking) {
    return (
      <GradientSurface variant="outlined" radius="xlarge" className={styles.errorPanel}>
        <h2 className={styles.errorTitle}>Could not read your habits</h2>

        {trackingErrorMessage ? (
          <p className={styles.errorMessage} role="alert">
            {trackingErrorMessage}
          </p>
        ) : null}

        <GradientButton tone="primary" isFullWidth onClick={reloadTodayTracking}>
          Try again
        </GradientButton>
      </GradientSurface>
    );
  }

  const { todayHabitRecord, recentHabitDays, dailyStepTarget, latestBodyMetricEntry } =
    todayTracking;

  const todaySummary = summariseDailyHabits({
    record: todayHabitRecord,
    dailyStepTarget,
    nightlySleepTargetHours,
  });

  /*
   * The coach's habit line rotates on the day of the month rather than on
   * anything to do with performance. It is a remark, not a verdict — tying it
   * to how the week went would turn five short lines into five judgements.
   */
  const habitCoachLine = selectCoachLine({
    candidateLines: findCoachLinesByCategory('habitEncouragement'),
    configuredVerbosity,
    rotationIndex: now.getDate(),
    mayUsePraise: false,
  });

  return (
    <>
      <DailyHabitChecklistPanel
        todayHabitRecord={todayHabitRecord}
        todaySummary={todaySummary}
        dailyStepTarget={dailyStepTarget}
        streakLength={countCurrentHabitStreak(recentHabitDays, todayIsoDate)}
        recentCompliance={summariseRecentHabitCompliance(
          recentHabitDays.slice(0, DAYS_IN_THE_COMPLIANCE_WINDOW),
        )}
        coachLine={habitCoachLine}
        isSaving={isSavingTracking}
        saveErrorMessage={saveErrorMessage}
        onHabitAnswered={recordHabitAnswer}
      />

      <QuickWeightLogPanel
        /*
         * Keyed on the number of weigh-ins that have landed, so a successful
         * save folds the panel shut by remounting it. Remounting is the honest
         * way to reset a form from the outside; an effect that watches a prop
         * and calls `setState` is the way that ends up one render behind.
         */
        key={`weigh-in-${String(completedWeighInCount)}`}
        startingWeightKilograms={latestBodyMetricEntry?.weightKilograms ?? fallbackWeightKilograms}
        hasWeighedInToday={latestBodyMetricEntry?.recordedOn === todayIsoDate}
        isSaving={isSavingTracking}
        saveErrorMessage={saveErrorMessage}
        onWeightLogged={recordBodyWeight}
      />
    </>
  );
}
