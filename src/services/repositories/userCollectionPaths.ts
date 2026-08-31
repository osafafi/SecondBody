import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';

import { firestoreDatabase } from '../firebase/firebaseApp';

/**
 * Where everything lives.
 *
 * Every path in the application is built here, so a collection is named as a
 * string in exactly one place. The alternative is `'workoutSessions'` typed out
 * in six repositories, where a typo creates a second, empty collection rather
 * than an error — Firestore will happily read from a path nothing has ever
 * written to and report no documents.
 *
 * Everything hangs off a single user document, which is what lets the whole
 * ruleset in `firestore.rules` be one rule. See docs/DATA_MODEL.md section 2.
 */

export const USERS_COLLECTION_NAME = 'users';

export const USER_SUBCOLLECTION_NAMES = {
  profile: 'profile',
  settings: 'settings',
  programAssignments: 'programAssignments',
  workoutSessions: 'workoutSessions',
  bodyMetrics: 'bodyMetrics',
  dailyHabits: 'dailyHabits',
  personalRecords: 'personalRecords',
} as const;

/**
 * `profile` and `settings` hold exactly one document each.
 *
 * A subcollection with a fixed id rather than fields on the user document, so
 * that reading "who is this person" does not also drag down their preferences,
 * and so each can be written without a merge that might clobber the other.
 */
export const SINGLETON_DOCUMENT_ID = 'current';

export function buildUserDocumentReference(userId: string): DocumentReference {
  return doc(firestoreDatabase, USERS_COLLECTION_NAME, userId);
}

export function buildUserSubcollectionReference(
  userId: string,
  subcollectionName: (typeof USER_SUBCOLLECTION_NAMES)[keyof typeof USER_SUBCOLLECTION_NAMES],
): CollectionReference {
  return collection(firestoreDatabase, USERS_COLLECTION_NAME, userId, subcollectionName);
}

export function buildUserSubdocumentReference(
  userId: string,
  subcollectionName: (typeof USER_SUBCOLLECTION_NAMES)[keyof typeof USER_SUBCOLLECTION_NAMES],
  documentId: string,
): DocumentReference {
  return doc(firestoreDatabase, USERS_COLLECTION_NAME, userId, subcollectionName, documentId);
}
