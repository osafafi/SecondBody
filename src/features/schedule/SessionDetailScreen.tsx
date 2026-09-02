import { ArrowLeft, CalendarX } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { APP_ROUTE_PATHS } from '@/app/appRoutes';
import { useAuthentication } from '@/app/useAuthentication';
import { useUserProfile } from '@/app/useUserProfile';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { NavigationLink } from '@/components/NavigationLink/NavigationLink';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { findExerciseById } from '@/content/exercises/allExercises';
import { parseIsoDate } from '@/domain/calendarDates';
import { buildPlannedSessionOutline } from '@/domain/plannedSessionOutline';
import {
  buildTrainingCalendar,
  findSessionOnDay,
  findTrainingCalendarDay,
  TRAINING_CALENDAR_FIRST_DAY_OF_WEEK,
  TRAINING_CALENDAR_WEEKS_AFTER_TODAY,
  TRAINING_CALENDAR_WEEKS_BEFORE_TODAY,
  type TrainingCalendarDay,
} from '@/domain/trainingCalendar';
import { useTrainingOverview, type TrainingOverview } from '@/hooks/useTrainingOverview';
import type { UserProfile } from '@/types/userAccountTypes';

import { LoggedSessionPanel } from './components/LoggedSessionPanel';
import { PlannedSessionPanel } from './components/PlannedSessionPanel';
import { formatShortDate } from './scheduleWording';
import styles from './SessionDetailScreen.module.css';

/**
 * One day of the calendar, opened: what was trained that day, or what is planned
 * for it.
 *
 * **It is addressed by date rather than by session id**, because half of what it
 * shows has no session document to name. A future Friday exists only as a
 * projection out of `buildTrainingCalendar`, and "what is on Friday" is the
 * question this screen was asked for.
 *
 * **It rebuilds the same calendar the grid did**, from the same shared window
 * constants, and that is load-bearing rather than lazy. The A / B / C projection
 * is a running cycle walked forward from the assignment, so a different window
 * would hand out different letters — the grid would show a B on Friday and this
 * screen would open a C.
 *
 * **Nothing here starts a session.** Reading what is coming is not doing it. The
 * Today screen owns the way into the session player because it is the screen
 * that knows about the 48-hour rail, and a second door would be a second place
 * for that rail to be got wrong.
 */
export function SessionDetailScreen() {
  const { isoDate } = useParams<{ isoDate: string }>();
  const { signedInUser } = useAuthentication();
  const { userProfile } = useUserProfile();

  const { overviewStatus, trainingOverview, overviewErrorMessage, reloadTrainingOverview } =
    useTrainingOverview(signedInUser?.userId ?? null);

  /* One reading of the clock for the whole screen. See the note on `TodayScreen`. */
  const now = new Date();

  const dayDate = isoDate ? parseIsoDate(isoDate) : null;

  return (
    <>
      <ScreenHeader
        title={dayDate ? formatShortDate(dayDate) : 'That day'}
        subtitle="From your calendar"
        trailingSlot={
          <NavigationLink
            to={APP_ROUTE_PATHS.schedule}
            tone="ghost"
            size="compact"
            leadingIcon={<ArrowLeft size={16} strokeWidth={2} aria-hidden />}
          >
            Schedule
          </NavigationLink>
        }
      />

      <div className={styles.body}>
        {overviewStatus === 'loading' ? (
          <GradientSurface variant="outlined" radius="large" className={styles.pendingPanel}>
            <p className={styles.pendingLabel} role="status">
              Reading that day
            </p>
          </GradientSurface>
        ) : null}

        {overviewStatus === 'failed' || (overviewStatus === 'ready' && !userProfile) ? (
          <GradientSurface variant="outlined" radius="large" className={styles.errorPanel}>
            <h2 className={styles.errorTitle}>Could not read that day</h2>

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

        {overviewStatus === 'ready' && trainingOverview && userProfile && isoDate ? (
          <DayContent
            now={now}
            isoDate={isoDate}
            trainingOverview={trainingOverview}
            userProfile={userProfile}
          />
        ) : null}
      </div>
    </>
  );
}

function DayContent({
  now,
  isoDate,
  trainingOverview,
  userProfile,
}: {
  now: Date;
  isoDate: string;
  trainingOverview: TrainingOverview;
  userProfile: UserProfile;
}) {
  const { assignment, programTemplate, recentSessions, startPosition } = trainingOverview;

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

  const calendarDay = findTrainingCalendarDay(calendarWeeks, isoDate);

  if (calendarDay?.kind === 'completedSession' || calendarDay?.kind === 'unfinishedSession') {
    const session = findSessionOnDay(recentSessions, isoDate);

    /*
     * The calendar drew the square from the same index this reads, so a day of
     * this kind always has a session behind it. Falling through to the empty
     * state rather than asserting is still cheaper than a crash in a gym.
     */
    if (session) {
      return <LoggedSessionPanel session={session} programTemplate={programTemplate} />;
    }
  }

  if (calendarDay?.kind === 'plannedSession' && calendarDay.sessionLetter) {
    /*
     * The letter is projected; the week number is not projected with it, and is
     * read off the current position instead. Projecting weeks forward would mean
     * guessing which weeks he actually trains in. The session names only change
     * at a phase boundary, so the error is small, rare, and corrects itself the
     * moment the phase turns over — the same trade the Schedule screen makes for
     * the "Coming up" list, for the same reason.
     */
    const plannedSession = buildPlannedSessionOutline({
      programTemplate,
      weekNumber: startPosition.weekNumber,
      sessionLetter: calendarDay.sessionLetter,
      activePainAreas: userProfile.painAreas,
      excludedExerciseIds: userProfile.excludedExerciseIds,
      unavailableExerciseIds: userProfile.unavailableExerciseIds,
      resolveSubstituteExerciseIds: (exerciseId) =>
        findExerciseById(exerciseId)?.substituteExerciseIds ?? [],
    });

    if (plannedSession) {
      return <PlannedSessionPanel plannedSession={plannedSession} />;
    }
  }

  return <NothingOnThisDayPanel calendarDay={calendarDay} />;
}

/**
 * A day with nothing behind it.
 *
 * Three different nothings, and they are worth telling apart: a rest day is the
 * plan working, a missed day is a fact to work around, and a date outside the
 * window is somewhere the calendar simply does not reach. None of them is a
 * failure, and none of them gets a coach line — Harout's voice lives in
 * `src/content/coachVoice/` and a missed Wednesday is not a moral event.
 */
function NothingOnThisDayPanel({ calendarDay }: { calendarDay: TrainingCalendarDay | null }) {
  const message = resolveNothingOnThisDayMessage(calendarDay);

  return (
    <GradientSurface variant="outlined" radius="xlarge" className={styles.emptyPanel}>
      <CalendarX className={styles.emptyIcon} size={28} strokeWidth={1.75} aria-hidden />
      <h2 className={styles.emptyTitle}>{message.title}</h2>
      <p className={styles.emptyMessage}>{message.detail}</p>
    </GradientSurface>
  );
}

function resolveNothingOnThisDayMessage(calendarDay: TrainingCalendarDay | null): {
  title: string;
  detail: string;
} {
  if (calendarDay === null) {
    return {
      title: 'Outside the calendar',
      detail:
        'The calendar covers three weeks either side of this one. That date is beyond what it reaches.',
    };
  }

  if (calendarDay.kind === 'missedSession') {
    return {
      title: 'Nothing was logged',
      detail:
        'This was a training day and no session was recorded against it. Which session it would have been is not knowable — the A, B, C cycle only moves when one is finished, so the next one you train is still the one that was due here.',
    };
  }

  return {
    title: 'A rest day',
    detail: 'Not a training day. The daily mobility routine on Today is the whole of the plan.',
  };
}
