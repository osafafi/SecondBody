import {
  OVERALL_SESSION_FEELINGS,
  PROGRAM_ASSIGNMENT_STATUSES,
  WORKOUT_SESSION_STATUSES,
  type PerformedExercise,
  type PerformedSet,
  type PersonalRecord,
  type ProgramAssignment,
  type WorkoutSession,
} from '@/types/trainingHistoryTypes';
import { EFFORT_RATINGS, SESSION_LETTERS } from '@/types/trainingVocabulary';

import { createDocumentReader } from './firestoreDocumentReading';

/**
 * Translating what happened in the gym between Firestore and the application's
 * types.
 *
 * Statuses and session letters are read strictly, unlike the equipment and pain
 * lists in `userAccountDocumentMapping.ts`. These unions are small, closed and
 * load-bearing — a session with an unrecognised status is not a degraded
 * session, it is a bug — so a bad value should be heard about rather than
 * quietly dropped.
 */

// ---------------------------------------------------------------------------
// Program assignments
// ---------------------------------------------------------------------------

export function fromProgramAssignmentDocument(
  documentId: string,
  documentData: unknown,
): ProgramAssignment {
  const reader = createDocumentReader(`programAssignments/${documentId}`, documentData);

  return {
    programTemplateId: reader.requiredString('programTemplateId'),
    startedOn: reader.requiredIsoDate('startedOn'),
    currentPhaseNumber: reader.requiredNumber('currentPhaseNumber'),
    currentWeekNumber: reader.requiredNumber('currentWeekNumber'),
    nextSessionLetter: reader.requiredMemberOf('nextSessionLetter', SESSION_LETTERS),
    status: reader.requiredMemberOf('status', PROGRAM_ASSIGNMENT_STATUSES),
    completedOn: reader.optionalIsoDate('completedOn'),
  };
}

export function toProgramAssignmentDocumentFields(
  assignment: ProgramAssignment,
): Record<string, unknown> {
  return {
    programTemplateId: assignment.programTemplateId,
    startedOn: assignment.startedOn,
    currentPhaseNumber: assignment.currentPhaseNumber,
    currentWeekNumber: assignment.currentWeekNumber,
    nextSessionLetter: assignment.nextSessionLetter,
    status: assignment.status,
    completedOn: assignment.completedOn,
  };
}

// ---------------------------------------------------------------------------
// Workout sessions
// ---------------------------------------------------------------------------

function fromPerformedSetDocument(
  documentLabel: string,
  setIndex: number,
  setData: unknown,
): PerformedSet {
  const reader = createDocumentReader(`${documentLabel} set ${String(setIndex + 1)}`, setData);

  return {
    setNumber: reader.requiredNumber('setNumber'),
    prescribedWeightKilograms: reader.optionalNumber('prescribedWeightKilograms'),
    prescribedReps: reader.requiredNumber('prescribedReps'),
    actualWeightKilograms: reader.optionalNumber('actualWeightKilograms'),
    actualReps: reader.requiredNumber('actualReps'),
    effortRating: reader.requiredMemberOf('effortRating', EFFORT_RATINGS),
    didCauseSharpPain: reader.requiredBoolean('didCauseSharpPain'),
    completedAt: reader.requiredInstant('completedAt'),
    restSecondsTaken: reader.optionalNumber('restSecondsTaken'),
  };
}

function fromPerformedExerciseDocument(
  documentLabel: string,
  exerciseIndex: number,
  exerciseData: unknown,
): PerformedExercise {
  const label = `${documentLabel} exercise ${String(exerciseIndex + 1)}`;
  const reader = createDocumentReader(label, exerciseData);

  return {
    exerciseId: reader.requiredString('exerciseId'),
    orderIndex: reader.requiredNumber('orderIndex'),
    performedSets: reader
      .objectArray('performedSets')
      .map((setData, setIndex) => fromPerformedSetDocument(label, setIndex, setData)),
    wasSkipped: reader.requiredBoolean('wasSkipped'),
    skipReason: reader.optionalString('skipReason'),
  };
}

export function fromWorkoutSessionDocument(
  documentId: string,
  documentData: unknown,
): WorkoutSession {
  const label = `workoutSessions/${documentId}`;
  const reader = createDocumentReader(label, documentData);

  return {
    programAssignmentId: reader.requiredString('programAssignmentId'),
    sessionLetter: reader.requiredMemberOf('sessionLetter', SESSION_LETTERS),
    phaseNumber: reader.requiredNumber('phaseNumber'),
    weekNumber: reader.requiredNumber('weekNumber'),

    startedAt: reader.requiredInstant('startedAt'),
    completedAt: reader.optionalInstant('completedAt'),

    status: reader.requiredMemberOf('status', WORKOUT_SESSION_STATUSES),

    performedExercises: reader
      .objectArray('performedExercises')
      .map((exerciseData, exerciseIndex) =>
        fromPerformedExerciseDocument(label, exerciseIndex, exerciseData),
      ),

    totalVolumeKilograms: reader.requiredNumber('totalVolumeKilograms'),
    durationSeconds: reader.optionalNumber('durationSeconds'),
    sessionNotes: reader.optionalString('sessionNotes'),
    overallFeeling: reader.optionalMemberOf('overallFeeling', OVERALL_SESSION_FEELINGS),
  };
}

/**
 * Sessions are written whole rather than field by field.
 *
 * A session is updated repeatedly as it is performed, and the thing being
 * updated is a nested array. Firestore cannot patch inside one, so the choice is
 * a whole-document write or an awkward subcollection of sets. A session is a few
 * kilobytes, and this keeps the reconnect behaviour simple: the last write wins
 * and it is complete.
 */
export function toWorkoutSessionDocumentFields(session: WorkoutSession): Record<string, unknown> {
  return {
    programAssignmentId: session.programAssignmentId,
    sessionLetter: session.sessionLetter,
    phaseNumber: session.phaseNumber,
    weekNumber: session.weekNumber,

    startedAt: session.startedAt,
    completedAt: session.completedAt,

    status: session.status,

    performedExercises: session.performedExercises.map((performedExercise) => ({
      exerciseId: performedExercise.exerciseId,
      orderIndex: performedExercise.orderIndex,
      wasSkipped: performedExercise.wasSkipped,
      skipReason: performedExercise.skipReason,
      performedSets: performedExercise.performedSets.map((performedSet) => ({
        setNumber: performedSet.setNumber,
        prescribedWeightKilograms: performedSet.prescribedWeightKilograms,
        prescribedReps: performedSet.prescribedReps,
        actualWeightKilograms: performedSet.actualWeightKilograms,
        actualReps: performedSet.actualReps,
        effortRating: performedSet.effortRating,
        didCauseSharpPain: performedSet.didCauseSharpPain,
        completedAt: performedSet.completedAt,
        restSecondsTaken: performedSet.restSecondsTaken,
      })),
    })),

    totalVolumeKilograms: session.totalVolumeKilograms,
    durationSeconds: session.durationSeconds,
    sessionNotes: session.sessionNotes,
    overallFeeling: session.overallFeeling,
  };
}

// ---------------------------------------------------------------------------
// Personal records
// ---------------------------------------------------------------------------

export function fromPersonalRecordDocument(
  documentId: string,
  documentData: unknown,
): PersonalRecord {
  const reader = createDocumentReader(`personalRecords/${documentId}`, documentData);

  return {
    // The document id IS the exercise id, so the stored field is a convenience
    // rather than the source of truth. Prefer the id when they disagree.
    exerciseId: documentId,
    bestWeightKilograms: reader.requiredNumber('bestWeightKilograms'),
    bestRepsAtBestWeight: reader.requiredNumber('bestRepsAtBestWeight'),
    estimatedOneRepMaxKilograms: reader.requiredNumber('estimatedOneRepMaxKilograms'),
    achievedOn: reader.requiredIsoDate('achievedOn'),
    achievedInSessionId: reader.requiredString('achievedInSessionId'),
  };
}

export function toPersonalRecordDocumentFields(record: PersonalRecord): Record<string, unknown> {
  return {
    exerciseId: record.exerciseId,
    bestWeightKilograms: record.bestWeightKilograms,
    bestRepsAtBestWeight: record.bestRepsAtBestWeight,
    estimatedOneRepMaxKilograms: record.estimatedOneRepMaxKilograms,
    achievedOn: record.achievedOn,
    achievedInSessionId: record.achievedInSessionId,
  };
}
