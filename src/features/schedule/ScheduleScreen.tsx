import { CalendarDays, Dumbbell } from 'lucide-react';

import { APP_ROUTE_PATHS } from '@/app/appRoutes';
import { useAuthentication } from '@/app/useAuthentication';
import { useUserProfile } from '@/app/useUserProfile';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { NavigationLink } from '@/components/NavigationLink/NavigationLink';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { WEEKDAY_NAMES } from '@/domain/calendarDates';
import { determineDailyTrainingStatus } from '@/domain/dailyTrainingStatus';
import { findPhaseForWeekNumber, findSessionTemplate } from '@/domain/programPhases';
import { summariseProgramProgress } from '@/domain/programProgressSummary';
import {
  buildTrainingCalendar,
  findUpcomingTrainingDays,
  TRAINING_CALENDAR_FIRST_DAY_OF_WEEK,
  TRAINING_CALENDAR_WEEKS_AFTER_TODAY,
  TRAINING_CALENDAR_WEEKS_BEFORE_TODAY,
} from '@/domain/trainingCalendar';
import { useTrainingOverview, type TrainingOverview } from '@/hooks/useTrainingOverview';
import type { ProgramTemplate } from '@/types/programTypes';
import type { SessionLetter } from '@/types/trainingVocabulary';
import type { UserProfile } from '@/types/userAccountTypes';

import { ProgramProgressPanel } from './components/ProgramProgressPanel';
import { RecoveryRailPanel } from './components/RecoveryRailPanel';
import { TrainingCalendarGrid } from './components/TrainingCalendarGrid';
import { UpcomingSessionsList, type UpcomingSessionRow } from './components/UpcomingSessionsList';
import styles from './ScheduleScreen.module.css';

/**
 * The training calendar: what was done, what is planned, and where the twelve
 * weeks have got to.
 *
 * It shares every read with the Today screen through `useTrainingOverview`, so
 * that the two screens cannot disagree about what week it is.
 */

/**
 * How far the "Coming up" list runs.
 *
 * Five rather than three, now that a row is something you can open and read.
 * Three was the right number for a list you could only look at; it is a short
 * list for one you are meant to browse.
 */
const UPCOMING_SESSION_COUNT = 5;

export function ScheduleScreen() {
  const { signedInUser } = useAuthentication();
  const { userProfile } = useUserProfile();

  const { overviewStatus, trainingOverview, overviewErrorMessage, reloadTrainingOverview } =
    useTrainingOverview(signedInUser?.userId ?? null);

  /* One reading of the clock for the whole screen. See the note on TodayScreen. */
  const now = new Date();

  return (
    <>
      <ScreenHeader
        title="Schedule"
        subtitle={describeTrainingDays(userProfile)}
        leadingSlot={<IconBadge icon={<CalendarDays size={22} strokeWidth={1.75} />} isSolid />}
        trailingSlot={
          <NavigationLink
            to={APP_ROUTE_PATHS.exerciseLibrary}
            size="compact"
            leadingIcon={<Dumbbell size={16} strokeWidth={2} aria-hidden />}
            accessibleLabel="Browse the exercise library"
          >
            Library
          </NavigationLink>
        }
      />

      <div className={styles.body}>
        {overviewStatus === 'loading' ? (
          <GradientSurface variant="outlined" radius="large" className={styles.pendingPanel}>
            <p className={styles.pendingLabel} role="status">
              Reading your training history
            </p>
          </GradientSurface>
        ) : null}

        {overviewStatus === 'failed' || (overviewStatus === 'ready' && !userProfile) ? (
          <GradientSurface variant="outlined" radius="large" className={styles.errorPanel}>
            <h2 className={styles.errorTitle}>Could not read your calendar</h2>

            {overviewErrorMessage ? (
              <p className={styles.errorMessage} role="alert">
                {overviewErrorMessage}
              </p>
            ) : null}

            <GradientButton tone="primary" isFullWidth onClick={reloadTrainingOverview}>
              Try again
            </GradientButton>
          </GradientSurface>
        ) : null}

        {overviewStatus === 'ready' && trainingOverview && userProfile ? (
          <ScheduleContent
            now={now}
            trainingOverview={trainingOverview}
            userProfile={userProfile}
          />
        ) : null}
      </div>
    </>
  );
}

/** "Monday, Wednesday, Friday", read off the profile rather than assumed. */
function describeTrainingDays(userProfile: UserProfile | null): string {
  const trainingDayNames = (userProfile?.trainingDaysOfWeek ?? [])
    .slice()
    .sort((firstDay, secondDay) => firstDay - secondDay)
    .map((dayOfWeek) => WEEKDAY_NAMES[dayOfWeek])
    .filter((dayName): dayName is (typeof WEEKDAY_NAMES)[number] => dayName !== undefined);

  return trainingDayNames.length === 0 ? 'No training days set' : trainingDayNames.join(', ');
}

function ScheduleContent({
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
    startPosition,
  } = trainingOverview;

  const trainingStatus = determineDailyTrainingStatus({
    now,
    trainingDaysOfWeek: userProfile.trainingDaysOfWeek,
    lastCompletedSessionAt,
    minimumHoursBetweenSessions: programTemplate.minimumHoursBetweenSessions,
    hasSessionInProgress,
    isProgrammeFinished: assignment.status === 'completed',
  });

  const calendarWeeks = buildTrainingCalendar({
    now,
    weeksBeforeToday: TRAINING_CALENDAR_WEEKS_BEFORE_TODAY,
    weeksAfterToday: TRAINING_CALENDAR_WEEKS_AFTER_TODAY,
    firstDayOfWeek: TRAINING_CALENDAR_FIRST_DAY_OF_WEEK,
    trainingDaysOfWeek: userProfile.trainingDaysOfWeek,
    recentSessions,
    nextSessionLetter: startPosition.sessionLetter,
    programmeStartedOn: assignment.startedOn,
  });

  const upcomingSessions: UpcomingSessionRow[] = findUpcomingTrainingDays(
    calendarWeeks,
    UPCOMING_SESSION_COUNT,
  ).map((upcomingDay) => ({
    ...upcomingDay,
    sessionDisplayName: resolveSessionDisplayName(
      programTemplate,
      startPosition.weekNumber,
      upcomingDay.sessionLetter,
    ),
  }));

  const progressSummary = summariseProgramProgress({
    programTemplate,
    assignment,
    completedSessionCount,
  });

  return (
    <>
      <ProgramProgressPanel progressSummary={progressSummary} phases={programTemplate.phases} />

      <TrainingCalendarGrid weeks={calendarWeeks} />

      <UpcomingSessionsList upcomingSessions={upcomingSessions} now={now} />

      <RecoveryRailPanel
        trainingStatus={trainingStatus}
        minimumHoursBetweenSessions={programTemplate.minimumHoursBetweenSessions}
      />
    </>
  );
}

/**
 * "Push & Hinge" for a projected session letter.
 *
 * Read from the phase the *current* week belongs to. A projection that ran past
 * a phase boundary would name the session it will be called then rather than the
 * one it is called now, and the alternative — projecting week numbers forward
 * as well as letters — would be guessing at which weeks he actually trains in.
 * The names only change at a phase boundary, so the error is small, rare, and
 * corrects itself the moment the phase turns over.
 */
function resolveSessionDisplayName(
  programTemplate: ProgramTemplate,
  weekNumber: number,
  sessionLetter: SessionLetter,
): string {
  const phase = findPhaseForWeekNumber(programTemplate, weekNumber);
  const sessionTemplate = phase ? findSessionTemplate(phase, sessionLetter) : null;

  return sessionTemplate?.displayName ?? '';
}
