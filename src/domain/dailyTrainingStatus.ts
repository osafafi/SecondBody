import { addLocalDays, countCalendarDaysBetween, startOfLocalDay } from './calendarDates';
import { determineSessionStartEligibility } from './sessionScheduling';

/**
 * What is on today.
 *
 * The Today screen has to answer one question before it can draw anything: is
 * he training, resting, recovering, or already done? Four different screens hang
 * off that answer, so the answer is decided here — once, with tests — rather
 * than as a chain of conditionals inside a component.
 *
 * **Two separate rails decide it, and only one of them is a rule.**
 *
 * 1. **The 48 hours.** From docs/TRAINING_PROGRAM.md section 12: never two
 *    strength sessions closer together than that. This is a safety rail and it
 *    is the only thing that stops a session being startable.
 * 2. **The training days.** Monday, Wednesday, Friday is a plan, not a law. A
 *    Wednesday missed for a late meeting is trained on Thursday — the coach line
 *    written in M2 says exactly that ("we pick up at the same session, not
 *    further along"). So the weekday shapes what the screen *says*, and never
 *    what it *allows*.
 *
 * Getting those the wrong way round would either lock him out of a session he
 * is entitled to train, or let him train two days running. Both matter, so both
 * are tested.
 */

/**
 * The stance the Today screen takes.
 *
 * Ordered here as they are decided, most specific first. Each one is a different
 * thing to say and a different thing to offer, which is why this is a union
 * rather than a handful of booleans a component has to reassemble.
 */
export const DAILY_TRAINING_STANCES = [
  /** A session was started and never finished. Everything else waits. */
  'sessionInProgress',

  /** Twelve weeks are done. There is no next session until a new block starts. */
  'programmeFinished',

  /** He has already trained today. */
  'trainedToday',

  /** Inside the 48 hours from the last session. Not today's answer, but soon. */
  'recovering',

  /** A training day, and clear to start. */
  'readyToTrain',

  /** Not a training day, but clear to train if he wants to. */
  'restDay',
] as const;

export type DailyTrainingStance = (typeof DAILY_TRAINING_STANCES)[number];

export type DailyTrainingStatusInput = {
  now: Date;

  /** From the profile. 0 is Sunday, matching `Date.getDay()`. */
  trainingDaysOfWeek: number[];

  /** Null when no session has ever been completed. */
  lastCompletedSessionAt: Date | null;

  /** The programme's own rail, normally 48. */
  minimumHoursBetweenSessions: number;

  /** True when a session document was left in the `inProgress` state. */
  hasSessionInProgress: boolean;

  /** True when the programme assignment has reached its last week and finished. */
  isProgrammeFinished: boolean;
};

export type DailyTrainingStatus = {
  stance: DailyTrainingStance;

  /** True when today is one of the profile's training days. */
  isTrainingDay: boolean;

  /** The 48-hour rail, and nothing else. A rest day is still allowed. */
  isAllowedToStartNow: boolean;

  /** 0 when a session can start now. Otherwise how much longer to wait. */
  hoursUntilAllowed: number;

  /** When the rail lifts. Null when it is not holding anything back. */
  earliestNextSessionAt: Date | null;

  /**
   * The next day that is both a training day and clear of the 48 hours.
   *
   * This can be today — a Wednesday morning after a Monday evening session is
   * still a Wednesday, it just is not clear until the evening. Null when the
   * profile has no training days at all.
   */
  nextAvailableTrainingDate: Date | null;

  /**
   * Calendar days since the last completed session, for saying so out loud.
   * Null when there has never been one.
   *
   * Calendar days rather than elapsed 24-hour periods, because this becomes the
   * words "yesterday" and "3 days ago". Trained at 19:00 last night and read at
   * 18:30 tonight is *yesterday*, and counting 24-hour periods would call it
   * today — which is both wrong and confusing next to a countdown that says
   * there are 25 hours still to wait.
   *
   * The layoff rule counts the other way and is right to: ten days away is a
   * question about recovery, not about the calendar. `useTrainingOverview`
   * passes `calculateWholeDaysBetween` to `determineLayoffAdjustment` for it.
   */
  daysSinceLastSession: number | null;

  hasTrainedToday: boolean;
};

/** How far ahead to look for a training day before giving up. Two weeks is plenty. */
const MAXIMUM_DAYS_TO_LOOK_AHEAD = 14;

/**
 * The next day he could actually train, honouring both rails at once.
 *
 * A day qualifies when it is a training day and its calendar date is on or after
 * the date the 48 hours run out. Comparing dates rather than instants is
 * deliberate: a rail that lifts at 19:00 on Wednesday does not disqualify
 * Wednesday, because Wednesday evening is when he trains.
 */
function findNextAvailableTrainingDate(
  now: Date,
  trainingDaysOfWeek: number[],
  earliestNextSessionAt: Date | null,
): Date | null {
  if (trainingDaysOfWeek.length === 0) {
    return null;
  }

  const earliestAllowedDay = startOfLocalDay(earliestNextSessionAt ?? now);

  for (let dayOffset = 0; dayOffset <= MAXIMUM_DAYS_TO_LOOK_AHEAD; dayOffset += 1) {
    const candidateDate = addLocalDays(now, dayOffset);

    const isTrainingDay = trainingDaysOfWeek.includes(candidateDate.getDay());
    const isClearOfTheRail =
      startOfLocalDay(candidateDate).getTime() >= earliestAllowedDay.getTime();

    if (isTrainingDay && isClearOfTheRail) {
      return candidateDate;
    }
  }

  // Only reachable if the profile holds day numbers outside 0-6.
  return null;
}

/**
 * Which of the six stances today is.
 *
 * `trainedToday` is checked before `recovering` on purpose. Both are true of a
 * Monday evening after a Monday afternoon session, and "you have already done
 * this today" is a far better thing to read than "36 hours to go".
 */
export function determineDailyTrainingStatus(input: DailyTrainingStatusInput): DailyTrainingStatus {
  const { now, trainingDaysOfWeek, lastCompletedSessionAt, minimumHoursBetweenSessions } = input;

  const eligibility = determineSessionStartEligibility({
    now,
    lastCompletedSessionAt,
    minimumHoursBetweenSessions,
  });

  const earliestNextSessionAt =
    lastCompletedSessionAt && !eligibility.isAllowedToStartNow
      ? new Date(lastCompletedSessionAt.getTime() + minimumHoursBetweenSessions * 60 * 60 * 1000)
      : null;

  const isTrainingDay = trainingDaysOfWeek.includes(now.getDay());

  const hasTrainedToday =
    lastCompletedSessionAt !== null &&
    startOfLocalDay(lastCompletedSessionAt).getTime() === startOfLocalDay(now).getTime();

  const daysSinceLastSession =
    lastCompletedSessionAt === null ? null : countCalendarDaysBetween(lastCompletedSessionAt, now);

  const sharedFacts = {
    isTrainingDay,
    isAllowedToStartNow: eligibility.isAllowedToStartNow,
    hoursUntilAllowed: eligibility.hoursUntilAllowed,
    earliestNextSessionAt,
    nextAvailableTrainingDate: findNextAvailableTrainingDate(
      now,
      trainingDaysOfWeek,
      earliestNextSessionAt,
    ),
    daysSinceLastSession,
    hasTrainedToday,
  };

  return { stance: resolveStance(input, sharedFacts), ...sharedFacts };
}

function resolveStance(
  input: DailyTrainingStatusInput,
  facts: Omit<DailyTrainingStatus, 'stance'>,
): DailyTrainingStance {
  /*
   * A session left open beats every other consideration, including a finished
   * programme and the 48 hours. He is standing in the middle of it: the rail
   * that stops a second session starting has nothing to say about finishing the
   * first one.
   */
  if (input.hasSessionInProgress) {
    return 'sessionInProgress';
  }

  if (input.isProgrammeFinished) {
    return 'programmeFinished';
  }

  if (facts.hasTrainedToday) {
    return 'trainedToday';
  }

  if (!facts.isAllowedToStartNow) {
    return 'recovering';
  }

  return facts.isTrainingDay ? 'readyToTrain' : 'restDay';
}

/**
 * Whether the Today screen offers a way into the session player.
 *
 * A rest day still offers it. The 48 hours are the only thing that takes it
 * away, and a finished programme is the only thing that makes it meaningless.
 */
export function canStartSessionFromTodayScreen(status: DailyTrainingStatus): boolean {
  if (status.stance === 'sessionInProgress') {
    return true;
  }

  return status.stance !== 'programmeFinished' && status.isAllowedToStartNow;
}
