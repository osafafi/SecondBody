import type { EffortRating, SessionLetter } from './trainingVocabulary';

/**
 * What happened in the gym: which programme is being followed, every session
 * performed, and the best a lift has ever been.
 *
 * Instants are `Date`. Calendar days are ISO date strings. See
 * `userAccountTypes.ts` for why neither is a Firestore `Timestamp`.
 */

export const PROGRAM_ASSIGNMENT_STATUSES = ['active', 'completed', 'abandoned'] as const;
export type ProgramAssignmentStatus = (typeof PROGRAM_ASSIGNMENT_STATUSES)[number];

/**
 * `users/{userId}/programAssignments/{assignmentId}`.
 *
 * Which programme he is on and where he is in it. Finished assignments are kept
 * rather than deleted, so a completed twelve-week block stays readable
 * afterwards.
 */
export type ProgramAssignment = {
  /** References a template in `src/content/programs/`. */
  programTemplateId: string;

  /** ISO date, `YYYY-MM-DD`. */
  startedOn: string;

  currentPhaseNumber: number;
  currentWeekNumber: number;
  nextSessionLetter: SessionLetter;

  status: ProgramAssignmentStatus;

  /** ISO date, or null while the assignment is still running. */
  completedOn: string | null;
};

export const WORKOUT_SESSION_STATUSES = ['inProgress', 'completed', 'abandoned'] as const;
export type WorkoutSessionStatus = (typeof WORKOUT_SESSION_STATUSES)[number];

export const OVERALL_SESSION_FEELINGS = ['strong', 'normal', 'rough'] as const;
export type OverallSessionFeeling = (typeof OVERALL_SESSION_FEELINGS)[number];

/**
 * One logged set.
 *
 * Weights are nullable, which is a deliberate departure from the shape sketched
 * in docs/DATA_MODEL.md. A dead bug and a treadmill walk have no weight, and
 * `PerformedSetRecord` in `performanceTypes.ts` — the shape progression actually
 * reads — has said so since M2. Storing `0` instead would be a lie the charts
 * would then average in.
 */
export type PerformedSet = {
  /** 1-based within the exercise. */
  setNumber: number;

  prescribedWeightKilograms: number | null;
  prescribedReps: number;

  actualWeightKilograms: number | null;

  /** For per-side movements this is reps per side, not the total. */
  actualReps: number;

  /** Drives auto-regulation. See docs/TRAINING_PROGRAM.md section 7. */
  effortRating: EffortRating;

  /**
   * Sharp or joint pain, as distinct from muscle burn. A safety signal rather
   * than an effort signal, and it outranks every other progression input.
   */
  didCauseSharpPain: boolean;

  completedAt: Date;

  /** Null when the set was logged without the rest timer running. */
  restSecondsTaken: number | null;
};

export type PerformedExercise = {
  /** References an exercise in `src/content/exercises/`. */
  exerciseId: string;

  /** 1-based position within the session. */
  orderIndex: number;

  performedSets: PerformedSet[];

  wasSkipped: boolean;
  skipReason: string | null;
};

/**
 * `users/{userId}/workoutSessions/{sessionId}`.
 *
 * Written when a session starts and updated as it goes, so a dropped connection
 * mid-workout does not lose the sets already done.
 */
export type WorkoutSession = {
  programAssignmentId: string;
  sessionLetter: SessionLetter;
  phaseNumber: number;
  weekNumber: number;

  startedAt: Date;
  completedAt: Date | null;

  status: WorkoutSessionStatus;

  performedExercises: PerformedExercise[];

  /** Sum of weight x reps. Denormalised so the charts do not recompute it. */
  totalVolumeKilograms: number;

  durationSeconds: number | null;
  sessionNotes: string | null;
  overallFeeling: OverallSessionFeeling | null;
};

/**
 * `users/{userId}/personalRecords/{exerciseId}`.
 *
 * Keyed by exercise id rather than a random one, so the record for a lift can be
 * read directly without a query.
 */
export type PersonalRecord = {
  exerciseId: string;
  bestWeightKilograms: number;
  bestRepsAtBestWeight: number;

  /** Epley. See `src/domain/estimatedOneRepMax.ts`. */
  estimatedOneRepMaxKilograms: number;

  /** ISO date, `YYYY-MM-DD`. */
  achievedOn: string;

  achievedInSessionId: string;
};

/** A stored document together with the Firestore id it was read from. */
export type WithDocumentId<TDocument> = TDocument & { documentId: string };
