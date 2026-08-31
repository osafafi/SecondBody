import type {
  OverallSessionFeeling,
  PerformedExercise,
  PerformedSet,
  WorkoutSession,
  WorkoutSessionStatus,
} from '@/types/trainingHistoryTypes';
import type { LoadingStyle } from '@/types/trainingVocabulary';

import type { PlannedExercise, PlannedPrescription, PlannedSession } from './sessionPlanning';
import { calculateSessionVolumeKilograms, type ExerciseVolumeInput } from './sessionVolume';

/**
 * Turning a prescription into something to log, and a pile of logged sets into
 * the document that gets stored.
 *
 * Kept out of the components because it is arithmetic and rules rather than
 * rendering: what the counter starts at, what a carry is counted in, and what
 * the totals come to.
 */

/**
 * What the number on a set actually counts.
 *
 * `PerformedSet` has exactly one count field, `actualReps`, and four kinds of
 * prescription to serve with it. Rather than pretend a farmer's carry has reps,
 * the unit is resolved explicitly, stored alongside nothing, and used to label
 * the control — so the person logging always knows whether they are being asked
 * for reps, metres or minutes.
 *
 * The rep-range progression in `exercisePrescription.ts` only ever reads sets
 * belonging to `weightAndReps` and `bodyweightReps` movements, so metres and
 * minutes never reach a comparison against a rep range.
 */
export const SET_COUNT_UNITS = ['reps', 'repsPerSide', 'metres', 'minutes'] as const;
export type SetCountUnit = (typeof SET_COUNT_UNITS)[number];

/** What one set is counted in, given how the exercise is prescribed. */
export function resolveSetCountUnit(prescription: PlannedPrescription): SetCountUnit {
  switch (prescription.kind) {
    case 'weightAndReps':
    case 'bodyweightReps':
      return prescription.isPerSide ? 'repsPerSide' : 'reps';

    case 'loadedCarry':
      return 'metres';

    case 'steadyStateCardio':
      return 'minutes';
  }
}

/** How big a step the count control takes. Metres move in fives; nothing else does. */
export function resolveSetCountStep(unit: SetCountUnit): number {
  return unit === 'metres' ? 5 : 1;
}

/**
 * A set being logged, before it is finished.
 *
 * Exactly `PerformedSet` minus the two facts only the app knows: when it was
 * completed and how long the rest before it lasted. Both are supplied by
 * `buildPerformedSetFromDraft`, so nothing typing into a form has to carry them.
 */
export type SetLogDraft = Omit<PerformedSet, 'completedAt' | 'restSecondsTaken'>;

/** What the prescription asks for on this set, ready to be edited down or up. */
export function createSetLogDraft(
  plannedExercise: PlannedExercise,
  setNumber: number,
): SetLogDraft {
  const { prescription } = plannedExercise;

  const baseDraft = {
    setNumber,
    /*
     * Prefilled with the prescription, so the common case — he did exactly what
     * was asked — is one tap. The effort rating is the field that always needs
     * an answer, so it starts at the middle rather than at a guess.
     */
    effortRating: 'justRight' as const,
    didCauseSharpPain: false,
  };

  switch (prescription.kind) {
    case 'weightAndReps':
      return {
        ...baseDraft,
        prescribedWeightKilograms: prescription.prescribedWeightKilograms,
        actualWeightKilograms: prescription.prescribedWeightKilograms,
        // The top of the range is the target: double progression climbs to it.
        prescribedReps: prescription.repRange.maximumReps,
        actualReps: prescription.repRange.maximumReps,
      };

    case 'bodyweightReps':
      return {
        ...baseDraft,
        prescribedWeightKilograms: null,
        actualWeightKilograms: null,
        prescribedReps: prescription.repRange.maximumReps,
        actualReps: prescription.repRange.maximumReps,
      };

    case 'loadedCarry':
      return {
        ...baseDraft,
        prescribedWeightKilograms: prescription.prescribedWeightKilograms,
        actualWeightKilograms: prescription.prescribedWeightKilograms,
        prescribedReps: prescription.distanceMetresPerSet,
        actualReps: prescription.distanceMetresPerSet,
      };

    case 'steadyStateCardio':
      return {
        ...baseDraft,
        prescribedWeightKilograms: null,
        actualWeightKilograms: null,
        prescribedReps: prescription.durationMinutes,
        actualReps: prescription.durationMinutes,
      };
  }
}

/** Seals a draft into the record that gets stored. */
export function buildPerformedSetFromDraft(
  draft: SetLogDraft,
  completedAt: Date,
  restSecondsTaken: number | null,
): PerformedSet {
  return { ...draft, completedAt, restSecondsTaken };
}

/**
 * How many working sets the whole session asks for.
 *
 * Cardio finishers count as one, which is what `resolveSessionPlan` already
 * says: a ten minute walk is one continuous effort rather than three sets of it.
 */
export function countPlannedSets(plannedSession: PlannedSession): number {
  return plannedSession.exercises.reduce(
    (runningTotal, plannedExercise) => runningTotal + plannedExercise.workingSetCount,
    0,
  );
}

export function countLoggedSets(loggedExercises: PerformedExercise[]): number {
  return loggedExercises.reduce(
    (runningTotal, loggedExercise) => runningTotal + loggedExercise.performedSets.length,
    0,
  );
}

function resolveIsPerSide(prescription: PlannedPrescription): boolean {
  return prescription.kind === 'weightAndReps' || prescription.kind === 'bodyweightReps'
    ? prescription.isPerSide
    : false;
}

/**
 * The volume inputs for everything logged so far.
 *
 * Loading style comes from the caller for the same reason `resolveSessionPlan`
 * takes it — `src/domain/` may not read `src/content/`. Anything logged against
 * an exercise the plan does not contain is dropped: it cannot be weighed
 * without a prescription to read `isPerSide` from, and it should not exist.
 */
function buildExerciseVolumeInputs(
  plannedSession: PlannedSession,
  loggedExercises: PerformedExercise[],
  resolveLoadingStyleForExercise: (exerciseId: string) => LoadingStyle | null,
): ExerciseVolumeInput[] {
  return loggedExercises.flatMap((loggedExercise) => {
    const plannedExercise = plannedSession.exercises.find(
      (candidate) => candidate.exerciseId === loggedExercise.exerciseId,
    );

    if (!plannedExercise) {
      return [];
    }

    return [
      {
        loadingStyle: resolveLoadingStyleForExercise(loggedExercise.exerciseId) ?? 'unloaded',
        isPerSide: resolveIsPerSide(plannedExercise.prescription),
        performedSets: loggedExercise.performedSets,
      },
    ];
  });
}

export type LoggedSessionSummary = {
  loggedSetCount: number;
  plannedSetCount: number;

  /** Exercises with at least one set against them. Skipped ones do not count. */
  performedExerciseCount: number;
  skippedExerciseCount: number;

  totalVolumeKilograms: number;
  durationSeconds: number;

  /** True when any set anywhere in the session was flagged for sharp pain. */
  didAnySetCauseSharpPain: boolean;
};

export type LoggedSessionSummaryInput = {
  plannedSession: PlannedSession;
  loggedExercises: PerformedExercise[];
  startedAt: Date;
  finishedAt: Date;
  resolveLoadingStyleForExercise: (exerciseId: string) => LoadingStyle | null;
};

/** What to show at the end, and what the session document denormalises. */
export function summariseLoggedSession(input: LoggedSessionSummaryInput): LoggedSessionSummary {
  const { plannedSession, loggedExercises, startedAt, finishedAt } = input;

  return {
    loggedSetCount: countLoggedSets(loggedExercises),
    plannedSetCount: countPlannedSets(plannedSession),
    performedExerciseCount: loggedExercises.filter(
      (loggedExercise) => loggedExercise.performedSets.length > 0,
    ).length,
    skippedExerciseCount: loggedExercises.filter((loggedExercise) => loggedExercise.wasSkipped)
      .length,
    totalVolumeKilograms: calculateSessionVolumeKilograms(
      buildExerciseVolumeInputs(
        plannedSession,
        loggedExercises,
        input.resolveLoadingStyleForExercise,
      ),
    ),
    durationSeconds: Math.max(0, Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000)),
    didAnySetCauseSharpPain: loggedExercises.some((loggedExercise) =>
      loggedExercise.performedSets.some((performedSet) => performedSet.didCauseSharpPain),
    ),
  };
}

export type WorkoutSessionRecordInput = LoggedSessionSummaryInput & {
  programAssignmentId: string;
  status: WorkoutSessionStatus;
  overallFeeling: OverallSessionFeeling | null;
  sessionNotes: string | null;
};

/**
 * The document to store.
 *
 * Built here rather than in the store so that "what gets written after every
 * set" is a pure function with a test, instead of an object literal assembled
 * inside a Firestore call.
 *
 * `completedAt` and `durationSeconds` are only filled in once the session is
 * actually finished. An in-progress session that is never resumed should read
 * as unfinished rather than as one that took eleven hours.
 */
export function buildWorkoutSessionRecord(input: WorkoutSessionRecordInput): WorkoutSession {
  const { plannedSession, loggedExercises, startedAt, finishedAt, status } = input;
  const isFinished = status !== 'inProgress';
  const summary = summariseLoggedSession(input);

  return {
    programAssignmentId: input.programAssignmentId,
    sessionLetter: plannedSession.sessionLetter,
    phaseNumber: plannedSession.phaseNumber,
    weekNumber: plannedSession.weekNumber,

    startedAt,
    completedAt: isFinished ? finishedAt : null,

    status,

    performedExercises: loggedExercises,

    totalVolumeKilograms: summary.totalVolumeKilograms,
    durationSeconds: isFinished ? summary.durationSeconds : null,
    sessionNotes: input.sessionNotes,
    overallFeeling: input.overallFeeling,
  };
}
