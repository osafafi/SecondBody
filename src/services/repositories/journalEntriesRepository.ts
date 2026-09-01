import { addDoc, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';

import type { JournalEntry } from '@/types/journalTypes';
import type { WithDocumentId } from '@/types/trainingHistoryTypes';

import { fromJournalEntryDocument, toJournalEntryDocumentFields } from './journalDocumentMapping';
import { USER_SUBCOLLECTION_NAMES, buildUserSubcollectionReference } from './userCollectionPaths';

/**
 * `users/{userId}/journalEntries/{entryId}` — what he wrote down during the
 * week.
 *
 * Append-only, like `bodyMetrics` and for a stronger reason: an entry is a
 * record of what somebody thought on a day, and an edit would rewrite the
 * history a coaching review reads. There is deliberately no update and no
 * delete here. If a note turns out to be wrong, the honest fix is another note
 * saying so.
 */

function buildJournalEntriesCollection(userId: string) {
  return buildUserSubcollectionReference(userId, USER_SUBCOLLECTION_NAMES.journalEntries);
}

export async function addJournalEntry(
  userId: string,
  entry: Omit<JournalEntry, 'writtenAt'>,
): Promise<string> {
  const createdEntry = await addDoc(buildJournalEntriesCollection(userId), {
    ...toJournalEntryDocumentFields(entry),
    writtenAt: serverTimestamp(),
  });

  return createdEntry.id;
}

/**
 * The most recent entries, newest first.
 *
 * Ordered by `writtenAt` rather than `aboutDate`, because this list is a record
 * of writing rather than of days: a note typed on Sunday about Friday's session
 * belongs at the top, next to the other things written on Sunday. The bundle
 * groups by `aboutDate` instead, which is the other question.
 */
export async function readRecentJournalEntries(
  userId: string,
  maximumCount: number,
): Promise<WithDocumentId<JournalEntry>[]> {
  const recentEntries = await getDocs(
    query(buildJournalEntriesCollection(userId), orderBy('writtenAt', 'desc'), limit(maximumCount)),
  );

  return recentEntries.docs.map((entryDocument) => ({
    ...fromJournalEntryDocument(entryDocument.id, entryDocument.data()),
    documentId: entryDocument.id,
  }));
}

/**
 * Everything a coaching review has not seen yet.
 *
 * A `where` and nothing else, so it stays on an automatic single-field index —
 * see the note on queries in this folder's README. The caller sorts, which is
 * free on the handful of documents this returns and is the difference between
 * this working and needing a composite index deployed.
 *
 * This is the query `reviewStatus` exists for. Nothing sets an entry to
 * `reviewed` yet, so today it returns everything; that is the write-back half
 * of M10 and it is not scheduled. See `JOURNAL_REVIEW_STATUSES`.
 */
export async function readJournalEntriesAwaitingReview(
  userId: string,
): Promise<WithDocumentId<JournalEntry>[]> {
  const awaitingReview = await getDocs(
    query(buildJournalEntriesCollection(userId), where('reviewStatus', '==', 'awaitingReview')),
  );

  return awaitingReview.docs.map((entryDocument) => ({
    ...fromJournalEntryDocument(entryDocument.id, entryDocument.data()),
    documentId: entryDocument.id,
  }));
}
