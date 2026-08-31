import {
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { buildEmptyDailyHabitRecord, type DailyHabitRecord } from '@/types/dailyTrackingTypes';

import { fromDailyHabitDocument, toDailyHabitDocumentFields } from './dailyTrackingDocumentMapping';
import {
  USER_SUBCOLLECTION_NAMES,
  buildUserSubcollectionReference,
  buildUserSubdocumentReference,
} from './userCollectionPaths';

/**
 * `users/{userId}/dailyHabits/{yyyy-mm-dd}` — four ticks and two numbers a day.
 *
 * Keyed by ISO date rather than a generated id, so a given day is read and
 * written directly with no query and no chance of two documents for one day.
 * The id is also the sort key: ISO dates sort correctly as strings.
 */

function buildDailyHabitsCollection(userId: string) {
  return buildUserSubcollectionReference(userId, USER_SUBCOLLECTION_NAMES.dailyHabits);
}

/**
 * Always returns a record.
 *
 * A day nobody has touched is a blank checklist, not an error — most days are
 * that until the evening. Callers should not each write the same empty object.
 */
export async function readDailyHabitRecord(
  userId: string,
  onDate: string,
): Promise<DailyHabitRecord> {
  const habitDocument = await getDoc(
    buildUserSubdocumentReference(userId, USER_SUBCOLLECTION_NAMES.dailyHabits, onDate),
  );

  if (!habitDocument.exists()) {
    return buildEmptyDailyHabitRecord(onDate, new Date());
  }

  return fromDailyHabitDocument(habitDocument.id, habitDocument.data());
}

/**
 * Saves one day, creating it if this is the first tick of the evening.
 *
 * Merged rather than replaced so ticking one box does not clear the others when
 * two devices have the same day open.
 */
export async function writeDailyHabitRecord(
  userId: string,
  record: Omit<DailyHabitRecord, 'updatedAt'>,
): Promise<void> {
  await setDoc(
    buildUserSubdocumentReference(userId, USER_SUBCOLLECTION_NAMES.dailyHabits, record.onDate),
    { ...toDailyHabitDocumentFields(record), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** The most recent days recorded, newest first. Used for streaks and charts. */
export async function readRecentDailyHabitRecords(
  userId: string,
  maximumCount: number,
): Promise<DailyHabitRecord[]> {
  const recentRecords = await getDocs(
    query(buildDailyHabitsCollection(userId), orderBy('onDate', 'desc'), limit(maximumCount)),
  );

  return recentRecords.docs.map((recordDocument) =>
    fromDailyHabitDocument(recordDocument.id, recordDocument.data()),
  );
}
