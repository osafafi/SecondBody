import type { BodyMetricEntry } from '@/types/dailyTrackingTypes';
import type { JournalEntry, JournalEntryKind, JournalReviewStatus } from '@/types/journalTypes';
import type { ProgramTemplate } from '@/types/programTypes';
import type {
  PerformedExercise,
  PerformedSet,
  PersonalRecord,
  ProgramAssignment,
  WithDocumentId,
  WorkoutSession,
} from '@/types/trainingHistoryTypes';
import type { PainArea, SessionLetter } from '@/types/trainingVocabulary';
import type { UserProfile } from '@/types/userAccountTypes';

import type { ExpectedWeightRangeKilograms } from './bodyWeightExpectations';
import {
  summariseBodyWeightTrend,
  type BodyWeightTrendPoint,
  type BodyWeightTrendVerdict,
} from './bodyWeightTrend';
import { countWholeWeeksSince, formatIsoDate, WEEKDAY_NAMES } from './calendarDates';
import { calculateEstimatedOneRepMaxKilograms } from './estimatedOneRepMax';
import {
  countCurrentHabitStreak,
  summariseRecentHabitCompliance,
  type HabitComplianceRow,
  type HabitDay,
} from './habitCompliance';
import { summariseProgramProgress, type ProgramProgressSummary } from './programProgressSummary';
import { groupTrainingVolumeByWeek, type TrainingVolumeWeek } from './trainingVolumeTrend';

/**
 * Everything a coach would need to know, in one object.
 *
 * This is the retrieval half of M10. The app has no LLM in it — there is no
 * server, no API key that could survive in a public static site, and no cost.
 * What the app has instead is the memory: it knows every set, every weigh-in,
 * every ticked habit and everything he wrote down. This module turns that into
 * a bundle that can be opened somewhere an LLM already is.
 *
 * **Two callers, one function, byte-identical output.** The download button in
 * Settings and `npm run coach:export` both end here, so a bundle exported from
 * the phone and a bundle exported from the laptop are the same file. That is
 * only true because this is a pure function in `src/domain/` — which is also
 * why the export script goes to the trouble of loading this very module rather
 * than reimplementing a JSON shape in a build tool.
 *
 * **It is not a Firestore dump.** A dump would be bigger, would name exercises
 * by id, and would make a reader recompute the things the app already computes.
 * So: ids are resolved to names, sets collapse to one short line each, and the
 * aggregates come from the same domain functions that draw the app's own
 * screens — if the bundle and the Progress tab ever disagreed, one of them
 * would be lying.
 */

/** Bumped when the shape changes in a way a reader would need to know about. */
export const COACHING_BUNDLE_FORMAT_VERSION = 1;

/** How many weeks of volume the bundle carries. One full programme block. */
export const COACHING_BUNDLE_VOLUME_WEEK_COUNT = 12;

// ---------------------------------------------------------------------------
// What goes in
// ---------------------------------------------------------------------------

export type CoachingBundleInput = {
  /** Passed in. Nothing in `src/domain/` reads a clock — see this folder's README. */
  generatedAt: Date;

  profile: UserProfile;

  /** Null when the programme has not been started yet. */
  assignment: ProgramAssignment | null;

  programTemplate: ProgramTemplate;

  /**
   * Sessions in any order and of any status. How many is the caller's decision
   * — the bundle carries every one it is handed, and both callers currently
   * read the same number.
   */
  sessions: readonly WithDocumentId<WorkoutSession>[];

  bodyMetricEntries: readonly BodyMetricEntry[];

  /** Calendar days with the targets that were in force on them, newest first. */
  habitDays: readonly HabitDay[];

  personalRecords: readonly PersonalRecord[];

  journalEntries: readonly WithDocumentId<JournalEntry>[];

  /**
   * An exercise id to the name a person would say. Passed in rather than
   * imported, because `src/domain/` may not read `src/content/` — the same
   * shape as `resolveLoadingStyleForExercise` in `sessionPlanning`.
   */
  resolveExerciseName: (exerciseId: string) => string | null;

  /** `Date.getDay()` numbering, where 0 is Sunday. The app passes 1. */
  firstDayOfWeek: number;
};

// ---------------------------------------------------------------------------
// What comes out
// ---------------------------------------------------------------------------

export type CoachingBundleAthlete = {
  displayName: string;
  ageYears: number;
  heightCentimetres: number;
  startingWeightKilograms: number;
  targetWeightKilograms: number;
  painAreas: PainArea[];

  /** Names rather than ids, so a reader knows what was ruled out. */
  excludedExercises: string[];

  /** `Date.getDay()` numbering. `trainingDayNames` says the same thing in words. */
  trainingDaysOfWeek: number[];
  trainingDayNames: string[];
};

export type CoachingBundleProgramme = {
  programTemplateId: string;
  displayName: string;

  /** ISO date. */
  startedOn: string;

  status: string;
  progress: ProgramProgressSummary;
};

export type CoachingBundleBodyWeight = {
  latestRecordedWeightKilograms: number | null;
  latestRollingAverageKilograms: number | null;
  changeSinceStartKilograms: number | null;
  weeklyChangeKilograms: number | null;
  remainingToTargetKilograms: number | null;
  verdict: BodyWeightTrendVerdict;

  /** Where the scale should be by now, given how many weeks have passed. */
  expectedRangeKilograms: ExpectedWeightRangeKilograms;

  /** Oldest first. The raw reading and the seven-day average for each day. */
  series: BodyWeightTrendPoint[];
};

export type CoachingBundleExercise = {
  exerciseId: string;

  /** The resolved name, or the id when content no longer has that exercise. */
  exerciseName: string;

  wasSkipped: boolean;
  skipReason: string | null;

  /** One line per set. See `describePerformedSet` for the shape. */
  sets: string[];

  /** The best estimated one-rep max across the exercise's sets, or null. */
  bestEstimatedOneRepMaxKilograms: number | null;

  /** True when any set in this exercise caused sharp or joint pain. */
  didCauseSharpPain: boolean;
};

export type CoachingBundleSession = {
  sessionId: string;
  sessionLetter: SessionLetter;
  phaseNumber: number;
  weekNumber: number;

  /** ISO dates in the local calendar, which is where the training happened. */
  startedOn: string;
  completedOn: string | null;

  status: string;
  durationMinutes: number | null;
  totalVolumeKilograms: number;
  overallFeeling: string | null;
  sessionNotes: string | null;

  exercises: CoachingBundleExercise[];
};

export type CoachingBundleTraining = {
  completedSessionCount: number;
  abandonedSessionCount: number;

  /** Oldest first, empty weeks included. A fortnight off is the point. */
  weeklyVolume: TrainingVolumeWeek[];

  /** Newest first. */
  sessions: CoachingBundleSession[];
};

export type CoachingBundlePersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  bestWeightKilograms: number;
  bestRepsAtBestWeight: number;
  estimatedOneRepMaxKilograms: number;
  achievedOn: string;
};

export type CoachingBundleHabits = {
  daysConsidered: number;
  goodDayCount: number;
  currentStreakDays: number;
  rows: HabitComplianceRow[];
};

export type CoachingBundleJournalEntry = {
  entryId: string;

  /** The day it is about, which is not always the day it was written. */
  aboutDate: string;

  /** ISO instant. */
  writtenAt: string;

  entryKind: JournalEntryKind;
  reviewStatus: JournalReviewStatus;

  /** Exactly what he wrote. Never shortened here or anywhere else. */
  bodyText: string;

  aboutSessionId: string | null;

  /** "Session B, week 3" — null when the session is outside the window read. */
  aboutSessionLabel: string | null;

  aboutExerciseId: string | null;
  aboutExerciseName: string | null;
};

export type CoachingBundleJournal = {
  /** Newest first. What a review has not been through yet. */
  awaitingReview: CoachingBundleJournalEntry[];

  /** Newest first. Kept for context, not for answering again. */
  alreadyReviewed: CoachingBundleJournalEntry[];
};

export type CoachingBundle = {
  bundleFormatVersion: number;

  /** ISO instant. */
  generatedAt: string;

  athlete: CoachingBundleAthlete;

  /** Null when the programme has not been started. */
  programme: CoachingBundleProgramme | null;

  bodyWeight: CoachingBundleBodyWeight;
  training: CoachingBundleTraining;
  personalRecords: CoachingBundlePersonalRecord[];
  habits: CoachingBundleHabits;
  journal: CoachingBundleJournal;
};

// ---------------------------------------------------------------------------
// Collapsing a set to one line
// ---------------------------------------------------------------------------

function formatWeight(weightKilograms: number | null): string {
  return weightKilograms === null ? 'bodyweight' : `${String(weightKilograms)} kg`;
}

/**
 * One set as one short line: `"60 kg x 10 justRight"`.
 *
 * A line rather than an object, because a session is thirty of these and thirty
 * five-field objects is most of the bundle for none of the meaning. The effort
 * rating is left as the stored word rather than being prettied into "just
 * right", so that what a reader sees is what is in the database.
 *
 * Two things are appended only when they are true, because a line that says
 * "no pain" thirty times buries the one that does not:
 *
 * - `(prescribed N)` when he did not do the reps he was asked for. That gap is
 *   the input to progression, so it must survive into the bundle.
 * - `(sharp pain)` when the set hurt. This outranks everything else in this
 *   application — see the domain README.
 */
export function describePerformedSet(set: PerformedSet): string {
  const parts = [`${formatWeight(set.actualWeightKilograms)} x ${String(set.actualReps)}`];

  parts.push(set.effortRating);

  if (set.actualReps !== set.prescribedReps) {
    parts.push(`(prescribed ${String(set.prescribedReps)})`);
  }

  if (set.didCauseSharpPain) {
    parts.push('(sharp pain)');
  }

  return parts.join(' ');
}

/**
 * The best estimated one-rep max in an exercise, or null.
 *
 * Only weight-and-reps sets are eligible, which is the same exclusion
 * `personalRecordProgress` makes and for the same reason: a carry stores metres
 * in `actualReps`, and Epley on that is a confident, meaningless number.
 */
function findBestEstimatedOneRepMax(sets: readonly PerformedSet[]): number | null {
  const estimates = sets
    .filter((set) => set.actualWeightKilograms !== null && set.actualReps > 0)
    .map((set) =>
      calculateEstimatedOneRepMaxKilograms(set.actualWeightKilograms ?? 0, set.actualReps),
    );

  return estimates.length === 0 ? null : Math.max(...estimates);
}

function buildBundleExercise(
  exercise: PerformedExercise,
  resolveExerciseName: (exerciseId: string) => string | null,
): CoachingBundleExercise {
  return {
    exerciseId: exercise.exerciseId,
    exerciseName: resolveExerciseName(exercise.exerciseId) ?? exercise.exerciseId,
    wasSkipped: exercise.wasSkipped,
    skipReason: exercise.skipReason,
    sets: exercise.performedSets.map(describePerformedSet),
    bestEstimatedOneRepMaxKilograms: findBestEstimatedOneRepMax(exercise.performedSets),
    didCauseSharpPain: exercise.performedSets.some((set) => set.didCauseSharpPain),
  };
}

function buildBundleSession(
  session: WithDocumentId<WorkoutSession>,
  resolveExerciseName: (exerciseId: string) => string | null,
): CoachingBundleSession {
  return {
    sessionId: session.documentId,
    sessionLetter: session.sessionLetter,
    phaseNumber: session.phaseNumber,
    weekNumber: session.weekNumber,
    startedOn: formatIsoDate(session.startedAt),
    completedOn: session.completedAt === null ? null : formatIsoDate(session.completedAt),
    status: session.status,
    durationMinutes:
      session.durationSeconds === null ? null : Math.round(session.durationSeconds / 60),
    totalVolumeKilograms: session.totalVolumeKilograms,
    overallFeeling: session.overallFeeling,
    sessionNotes: session.sessionNotes,
    exercises: [...session.performedExercises]
      .sort((first, second) => first.orderIndex - second.orderIndex)
      .map((exercise) => buildBundleExercise(exercise, resolveExerciseName)),
  };
}

/** "Session B, week 3" — enough for a reader to find the session above. */
function describeSessionBriefly(session: WithDocumentId<WorkoutSession>): string {
  return `Session ${session.sessionLetter}, week ${String(session.weekNumber)}`;
}

function buildBundleJournalEntry(
  entry: WithDocumentId<JournalEntry>,
  sessionsById: ReadonlyMap<string, WithDocumentId<WorkoutSession>>,
  resolveExerciseName: (exerciseId: string) => string | null,
): CoachingBundleJournalEntry {
  const taggedSession =
    entry.aboutSessionId === null ? undefined : sessionsById.get(entry.aboutSessionId);

  return {
    entryId: entry.documentId,
    aboutDate: entry.aboutDate,
    writtenAt: entry.writtenAt.toISOString(),
    entryKind: entry.entryKind,
    reviewStatus: entry.reviewStatus,
    bodyText: entry.bodyText,
    aboutSessionId: entry.aboutSessionId,
    aboutSessionLabel: taggedSession === undefined ? null : describeSessionBriefly(taggedSession),
    aboutExerciseId: entry.aboutExerciseId,
    aboutExerciseName:
      entry.aboutExerciseId === null ? null : resolveExerciseName(entry.aboutExerciseId),
  };
}

// ---------------------------------------------------------------------------
// The bundle
// ---------------------------------------------------------------------------

/**
 * Gathers everything into the shape a coaching conversation starts from.
 *
 * Deterministic: every list is sorted here rather than being left in whatever
 * order the reads came back in, so two exports of the same data are the same
 * file and a diff between two weeks is a diff of what changed.
 */
export function buildCoachingBundle(input: CoachingBundleInput): CoachingBundle {
  const {
    generatedAt,
    profile,
    assignment,
    programTemplate,
    sessions,
    bodyMetricEntries,
    habitDays,
    personalRecords,
    journalEntries,
    resolveExerciseName,
    firstDayOfWeek,
  } = input;

  const todayIsoDate = formatIsoDate(generatedAt);

  const sessionsNewestFirst = [...sessions].sort(
    (first, second) => second.startedAt.getTime() - first.startedAt.getTime(),
  );

  const completedSessions = sessionsNewestFirst.filter((session) => session.status === 'completed');

  const weeksElapsed =
    assignment === null ? 0 : countWholeWeeksSince(assignment.startedOn, generatedAt);

  const bodyWeightTrend = summariseBodyWeightTrend({
    observations: bodyMetricEntries
      .filter(
        (entry): entry is BodyMetricEntry & { weightKilograms: number } =>
          entry.weightKilograms !== null,
      )
      .map((entry) => ({ onDate: entry.recordedOn, weightKilograms: entry.weightKilograms })),
    startingWeightKilograms: profile.startingWeightKilograms,
    targetWeightKilograms: profile.targetWeightKilograms,
    weeksElapsed,
  });

  const habitCompliance = summariseRecentHabitCompliance([...habitDays]);

  const sessionsById = new Map(sessionsNewestFirst.map((session) => [session.documentId, session]));

  const journalEntriesNewestFirst = [...journalEntries]
    .sort((first, second) => second.writtenAt.getTime() - first.writtenAt.getTime())
    .map((entry) => buildBundleJournalEntry(entry, sessionsById, resolveExerciseName));

  return {
    bundleFormatVersion: COACHING_BUNDLE_FORMAT_VERSION,
    generatedAt: generatedAt.toISOString(),

    athlete: {
      displayName: profile.displayName,
      ageYears: generatedAt.getFullYear() - profile.birthYear,
      heightCentimetres: profile.heightCentimetres,
      startingWeightKilograms: profile.startingWeightKilograms,
      targetWeightKilograms: profile.targetWeightKilograms,
      painAreas: [...profile.painAreas],
      excludedExercises: profile.excludedExerciseIds.map(
        (exerciseId) => resolveExerciseName(exerciseId) ?? exerciseId,
      ),
      trainingDaysOfWeek: [...profile.trainingDaysOfWeek].sort(
        (firstDay, secondDay) => firstDay - secondDay,
      ),
      trainingDayNames: [...profile.trainingDaysOfWeek]
        .sort((firstDay, secondDay) => firstDay - secondDay)
        .map((dayOfWeek) => WEEKDAY_NAMES[dayOfWeek])
        .filter((dayName): dayName is (typeof WEEKDAY_NAMES)[number] => dayName !== undefined),
    },

    programme:
      assignment === null
        ? null
        : {
            programTemplateId: assignment.programTemplateId,
            displayName: programTemplate.displayName,
            startedOn: assignment.startedOn,
            status: assignment.status,
            progress: summariseProgramProgress({
              programTemplate,
              assignment,
              completedSessionCount: completedSessions.length,
            }),
          },

    bodyWeight: {
      latestRecordedWeightKilograms: bodyWeightTrend.latestRecordedWeightKilograms,
      latestRollingAverageKilograms: bodyWeightTrend.latestRollingAverageKilograms,
      changeSinceStartKilograms: bodyWeightTrend.changeSinceStartKilograms,
      weeklyChangeKilograms: bodyWeightTrend.weeklyChangeKilograms,
      remainingToTargetKilograms: bodyWeightTrend.remainingToTargetKilograms,
      verdict: bodyWeightTrend.verdict,
      expectedRangeKilograms: bodyWeightTrend.expectedRange,
      series: bodyWeightTrend.series,
    },

    training: {
      completedSessionCount: completedSessions.length,
      abandonedSessionCount: sessionsNewestFirst.filter((session) => session.status === 'abandoned')
        .length,

      weeklyVolume: groupTrainingVolumeByWeek({
        completedSessions: completedSessions
          .filter(
            (session): session is WithDocumentId<WorkoutSession> & { completedAt: Date } =>
              session.completedAt !== null,
          )
          .map((session) => ({
            completedAt: session.completedAt,
            totalVolumeKilograms: session.totalVolumeKilograms,
          })),
        now: generatedAt,
        weekCount: COACHING_BUNDLE_VOLUME_WEEK_COUNT,
        firstDayOfWeek,
      }),

      sessions: sessionsNewestFirst.map((session) =>
        buildBundleSession(session, resolveExerciseName),
      ),
    },

    personalRecords: [...personalRecords]
      .sort((first, second) => first.exerciseId.localeCompare(second.exerciseId))
      .map((record) => ({
        exerciseId: record.exerciseId,
        exerciseName: resolveExerciseName(record.exerciseId) ?? record.exerciseId,
        bestWeightKilograms: record.bestWeightKilograms,
        bestRepsAtBestWeight: record.bestRepsAtBestWeight,
        estimatedOneRepMaxKilograms: record.estimatedOneRepMaxKilograms,
        achievedOn: record.achievedOn,
      })),

    habits: {
      daysConsidered: habitCompliance.daysConsidered,
      goodDayCount: habitCompliance.goodDayCount,
      currentStreakDays: countCurrentHabitStreak([...habitDays], todayIsoDate),
      rows: habitCompliance.rows,
    },

    journal: {
      awaitingReview: journalEntriesNewestFirst.filter(
        (entry) => entry.reviewStatus === 'awaitingReview',
      ),
      alreadyReviewed: journalEntriesNewestFirst.filter(
        (entry) => entry.reviewStatus === 'reviewed',
      ),
    },
  };
}

/**
 * The bundle as the bytes that get written to a file.
 *
 * Here rather than at each caller so that the download and the export script
 * produce the same file to the byte. Two spaces and a trailing newline, because
 * this ends up in a text editor and in a terminal at least as often as it ends
 * up in a parser.
 */
export function formatCoachingBundleAsJson(bundle: CoachingBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

/**
 * `coaching-bundle-2026-09-01.json`.
 *
 * Dated by the local day rather than the instant: two exports on one day are
 * the same file, which is the right behaviour for a snapshot of everything so
 * far. Shared by both callers so a downloaded bundle and an exported one are
 * recognisably the same thing.
 */
export function buildCoachingBundleFileName(generatedAt: Date): string {
  return `coaching-bundle-${formatIsoDate(generatedAt)}.json`;
}
