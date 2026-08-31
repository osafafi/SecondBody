import { addDoc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';

import type { ProgramAssignment, WithDocumentId } from '@/types/trainingHistoryTypes';

import {
  fromProgramAssignmentDocument,
  toProgramAssignmentDocumentFields,
} from './trainingHistoryDocumentMapping';
import {
  USER_SUBCOLLECTION_NAMES,
  buildUserSubcollectionReference,
  buildUserSubdocumentReference,
} from './userCollectionPaths';

/**
 * `users/{userId}/programAssignments/{assignmentId}` — which programme is being
 * followed and where he is in it.
 *
 * Finished assignments are kept rather than deleted, so a completed twelve-week
 * block stays readable afterwards.
 *
 * **Every query here is single-field on purpose.** Firestore creates those
 * indexes automatically; a composite one has to be declared and deployed, and
 * `firebase.json` deliberately ships rules only. There is at most one active
 * assignment, so filtering without also sorting costs nothing.
 */

function buildAssignmentsCollection(userId: string) {
  return buildUserSubcollectionReference(userId, USER_SUBCOLLECTION_NAMES.programAssignments);
}

/** The programme currently being followed, or null before one is started. */
export async function readActiveProgramAssignment(
  userId: string,
): Promise<WithDocumentId<ProgramAssignment> | null> {
  const activeAssignments = await getDocs(
    query(buildAssignmentsCollection(userId), where('status', '==', 'active'), limit(1)),
  );

  const activeAssignment = activeAssignments.docs[0];

  if (!activeAssignment) {
    return null;
  }

  return {
    ...fromProgramAssignmentDocument(activeAssignment.id, activeAssignment.data()),
    documentId: activeAssignment.id,
  };
}

/** Starts a programme, returning the id of the assignment that was created. */
export async function createProgramAssignment(
  userId: string,
  assignment: ProgramAssignment,
): Promise<string> {
  const createdAssignment = await addDoc(
    buildAssignmentsCollection(userId),
    toProgramAssignmentDocumentFields(assignment),
  );

  return createdAssignment.id;
}

/**
 * Moves an assignment on: the next session letter, the week, the phase, or the
 * status when the block finishes.
 */
export async function updateProgramAssignment(
  userId: string,
  assignmentId: string,
  assignmentChanges: Partial<ProgramAssignment>,
): Promise<void> {
  /*
   * Spread directly rather than routed through
   * `toProgramAssignmentDocumentFields`. Every field on an assignment is a
   * primitive whose stored name matches its type name — nothing to convert,
   * nothing nested to rebuild — so that function is identity-shaped here.
   * Round-tripping a partial through it would mean inventing values for the
   * fields that are not being changed, which is how a "move to week 4" ends up
   * also resetting the programme id.
   */
  await updateDoc(
    buildUserSubdocumentReference(
      userId,
      USER_SUBCOLLECTION_NAMES.programAssignments,
      assignmentId,
    ),
    { ...assignmentChanges },
  );
}
