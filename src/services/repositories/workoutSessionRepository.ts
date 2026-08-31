import { addDoc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';

import type { WithDocumentId, WorkoutSession } from '@/types/trainingHistoryTypes';

import {
  fromWorkoutSessionDocument,
  toWorkoutSessionDocumentFields,
} from './trainingHistoryDocumentMapping';
import {
  USER_SUBCOLLECTION_NAMES,
  buildUserSubcollectionReference,
  buildUserSubdocumentReference,
} from './userCollectionPaths';

/**
 * `users/{userId}/workoutSessions/{sessionId}` — every session performed.
 *
 * A session is created when it starts and rewritten as it goes, so a dropped
 * connection mid-workout does not lose the sets already logged. Firestore's
 * local cache queues those writes and flushes them on reconnect, which is what
 * makes a dead spot in the gym invisible rather than destructive.
 */

function buildSessionsCollection(userId: string) {
  return buildUserSubcollectionReference(userId, USER_SUBCOLLECTION_NAMES.workoutSessions);
}

/** Creates the session record at the moment the first exercise is opened. */
export async function createWorkoutSession(
  userId: string,
  session: WorkoutSession,
): Promise<string> {
  const createdSession = await addDoc(
    buildSessionsCollection(userId),
    toWorkoutSessionDocumentFields(session),
  );

  return createdSession.id;
}

/**
 * Replaces the whole session document.
 *
 * Whole rather than patched because the thing that changes is a nested array of
 * sets, and Firestore cannot update inside one. See the note on
 * `toWorkoutSessionDocumentFields`.
 */
export async function saveWorkoutSession(
  userId: string,
  sessionId: string,
  session: WorkoutSession,
): Promise<void> {
  await setDoc(
    buildUserSubdocumentReference(userId, USER_SUBCOLLECTION_NAMES.workoutSessions, sessionId),
    toWorkoutSessionDocumentFields(session),
  );
}

/**
 * A session that was started and never finished, if there is one.
 *
 * This is what lets the app offer to resume after the phone locked itself, the
 * browser was closed, or the gym wifi dropped mid-set.
 */
export async function readInProgressWorkoutSession(
  userId: string,
): Promise<WithDocumentId<WorkoutSession> | null> {
  const inProgressSessions = await getDocs(
    query(buildSessionsCollection(userId), where('status', '==', 'inProgress'), limit(1)),
  );

  const inProgressSession = inProgressSessions.docs[0];

  if (!inProgressSession) {
    return null;
  }

  return {
    ...fromWorkoutSessionDocument(inProgressSession.id, inProgressSession.data()),
    documentId: inProgressSession.id,
  };
}

/**
 * The most recent sessions, newest first.
 *
 * Ordered by `startedAt` and nothing else, which keeps it on an automatic
 * single-field index. Progression only ever needs the last handful, so the limit
 * is a real bound rather than pagination waiting to happen.
 */
export async function readRecentWorkoutSessions(
  userId: string,
  maximumCount: number,
): Promise<WithDocumentId<WorkoutSession>[]> {
  const recentSessions = await getDocs(
    query(buildSessionsCollection(userId), orderBy('startedAt', 'desc'), limit(maximumCount)),
  );

  return recentSessions.docs.map((sessionDocument) => ({
    ...fromWorkoutSessionDocument(sessionDocument.id, sessionDocument.data()),
    documentId: sessionDocument.id,
  }));
}
