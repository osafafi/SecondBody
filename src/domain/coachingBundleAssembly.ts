import type { BodyMetricEntry, DailyHabitRecord } from '@/types/dailyTrackingTypes';
import type { JournalEntry } from '@/types/journalTypes';
import type { ProgramTemplate } from '@/types/programTypes';
import type {
  PersonalRecord,
  ProgramAssignment,
  WithDocumentId,
  WorkoutSession,
} from '@/types/trainingHistoryTypes';
import type { UserProfile } from '@/types/userAccountTypes';

import { countWholeWeeksSince, formatIsoDate, parseIsoDate } from './calendarDates';
import { buildCoachingBundle, type CoachingBundle } from './coachingBundle';
import { buildRecentHabitDays } from './habitCompliance';
import { calculateDailyStepTarget } from './habitTargets';

/**
 * Everything between "here are the stored documents" and a finished bundle.
 *
 * This exists because there are two callers and they must not diverge. The
 * download button in Settings reads Firestore with the web SDK; `npm run
 * coach:export` reads it with `firebase-admin`. Those are different libraries
 * and different processes, and the only way the two files can be identical is
 * if everything after the read is one function that neither of them owns.
 *
 * So: pure, in `src/domain/`, tested like everything else here. It takes stored
 * documents and the handful of facts that live in `src/content/` — the step
 * ramp, the sleep target, the programme, the exercise names — and returns the
 * bundle. Content is passed in rather than imported, which is the rule for this
 * folder and is also what lets a Node script use it.
 */

/**
 * How much of each collection a bundle carries.
 *
 * Here rather than at each caller, because the download and the export script
 * have to read the same windows — two exports that disagree about how far back
 * they looked are two exports that cannot be compared. The numbers are all
 * comfortably more than one twelve-week block, so a whole programme fits in one
 * bundle without pagination.
 */
export const COACHING_EXPORT_LIMITS = {
  /** 36 sessions in a block, so this covers one and the start of the next. */
  sessionCount: 60,

  /** Daily weigh-ins for four months. */
  bodyMetricEntryCount: 200,

  /** Calendar days of habits, blanks included. About seventeen weeks. */
  habitDayCount: 120,

  journalEntryCount: 200,
} as const;

/** Monday, matching the calendar in M6 and the volume chart in M7. */
export const COACHING_BUNDLE_FIRST_DAY_OF_WEEK = 1;

/** Exactly what the two callers read out of Firestore, in whatever order. */
export type StoredCoachingData = {
  profile: UserProfile;

  /** Null when the programme has not been started yet. */
  assignment: ProgramAssignment | null;

  sessions: readonly WithDocumentId<WorkoutSession>[];
  bodyMetricEntries: readonly BodyMetricEntry[];
  habitRecords: readonly DailyHabitRecord[];
  personalRecords: readonly PersonalRecord[];
  journalEntries: readonly WithDocumentId<JournalEntry>[];
};

/** The facts from `src/content/` that the assembly needs, passed in. */
export type CoachingContentFacts = {
  programTemplate: ProgramTemplate;

  /** The two ends of the step ramp, from `dailyHabitDefinitions`. */
  startingDailyStepTarget: number;
  finalDailyStepTarget: number;

  nightlySleepTargetHours: number;

  resolveExerciseName: (exerciseId: string) => string | null;
};

export type CoachingBundleAssemblyInput = {
  /** Passed in. Nothing in `src/domain/` reads a clock. */
  generatedAt: Date;

  storedData: StoredCoachingData;
  contentFacts: CoachingContentFacts;

  /** `Date.getDay()` numbering, where 0 is Sunday. Both callers pass 1. */
  firstDayOfWeek: number;

  /** A ceiling on how many calendar days of habits the bundle carries. */
  maximumHabitDayCount: number;
};

/**
 * The one path from stored documents to a bundle.
 *
 * The only real work here is turning habit records into habit **days**: the
 * bundle needs every calendar day, including the ones nothing was written for,
 * each judged against the step target that was in force on it. A day judged
 * against today's target would turn a good run in week two into a run of
 * failures every time the ramp stepped up — see `habitCompliance`.
 */
export function assembleCoachingBundle(input: CoachingBundleAssemblyInput): CoachingBundle {
  const { generatedAt, storedData, contentFacts, firstDayOfWeek, maximumHabitDayCount } = input;

  const todayIsoDate = formatIsoDate(generatedAt);

  /*
   * With no assignment there is no programme start, so there is no week number
   * to ramp the step target against and no earliest day to stop at. Today is
   * the honest floor: nothing was being asked for before the programme existed.
   */
  const programmeStartedOn = storedData.assignment?.startedOn ?? todayIsoDate;

  const habitDays = buildRecentHabitDays({
    records: [...storedData.habitRecords],
    todayIsoDate,
    earliestIsoDate: programmeStartedOn,
    maximumDayCount: maximumHabitDayCount,
    resolveDailyStepTarget: (isoDate) =>
      calculateDailyStepTarget({
        weekNumber: countWholeWeeksSince(programmeStartedOn, parseIsoDate(isoDate)) + 1,
        totalWeekCount: contentFacts.programTemplate.totalWeekCount,
        startingDailyStepTarget: contentFacts.startingDailyStepTarget,
        finalDailyStepTarget: contentFacts.finalDailyStepTarget,
      }),
    nightlySleepTargetHours: contentFacts.nightlySleepTargetHours,
  });

  return buildCoachingBundle({
    generatedAt,
    profile: storedData.profile,
    assignment: storedData.assignment,
    programTemplate: contentFacts.programTemplate,
    sessions: storedData.sessions,
    bodyMetricEntries: storedData.bodyMetricEntries,
    habitDays,
    personalRecords: storedData.personalRecords,
    journalEntries: storedData.journalEntries,
    resolveExerciseName: contentFacts.resolveExerciseName,
    firstDayOfWeek,
  });
}
