import { getDoc, getDocs, setDoc } from 'firebase/firestore';

import type { PersonalRecord } from '@/types/trainingHistoryTypes';

import {
  fromPersonalRecordDocument,
  toPersonalRecordDocumentFields,
} from './trainingHistoryDocumentMapping';
import {
  USER_SUBCOLLECTION_NAMES,
  buildUserSubcollectionReference,
  buildUserSubdocumentReference,
} from './userCollectionPaths';

/**
 * `users/{userId}/personalRecords/{exerciseId}` — the best a lift has ever been.
 *
 * Keyed by exercise id rather than a generated one, so checking "is this a PR"
 * mid-session is a direct read of a known path rather than a query. That matters
 * in a gym with one bar of signal.
 */

function buildPersonalRecordsCollection(userId: string) {
  return buildUserSubcollectionReference(userId, USER_SUBCOLLECTION_NAMES.personalRecords);
}

export async function readPersonalRecord(
  userId: string,
  exerciseId: string,
): Promise<PersonalRecord | null> {
  const recordDocument = await getDoc(
    buildUserSubdocumentReference(userId, USER_SUBCOLLECTION_NAMES.personalRecords, exerciseId),
  );

  return recordDocument.exists()
    ? fromPersonalRecordDocument(recordDocument.id, recordDocument.data())
    : null;
}

/** Every record, for the progress screen. One document per exercise ever trained. */
export async function readAllPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const recordDocuments = await getDocs(buildPersonalRecordsCollection(userId));

  return recordDocuments.docs.map((recordDocument) =>
    fromPersonalRecordDocument(recordDocument.id, recordDocument.data()),
  );
}

/**
 * Replaces the record for one exercise.
 *
 * **Whether this is actually a new best is not decided here.** That comparison
 * belongs in `src/domain/`, where it can be tested; a repository that silently
 * refused a write would hide a bug in that logic rather than surface it.
 */
export async function writePersonalRecord(userId: string, record: PersonalRecord): Promise<void> {
  await setDoc(
    buildUserSubdocumentReference(
      userId,
      USER_SUBCOLLECTION_NAMES.personalRecords,
      record.exerciseId,
    ),
    toPersonalRecordDocumentFields(record),
  );
}
