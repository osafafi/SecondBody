import { addDoc, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';

import type { BodyMetricEntry } from '@/types/dailyTrackingTypes';

import { fromBodyMetricDocument, toBodyMetricDocumentFields } from './dailyTrackingDocumentMapping';
import { USER_SUBCOLLECTION_NAMES, buildUserSubcollectionReference } from './userCollectionPaths';

/**
 * `users/{userId}/bodyMetrics/{metricId}` — the scale, and the tape measure that
 * does not exist yet.
 *
 * Entries are appended rather than edited. Two weigh-ins on one day are a real
 * thing that happens, and keeping both is more honest than deciding which one
 * counted.
 */

function buildBodyMetricsCollection(userId: string) {
  return buildUserSubcollectionReference(userId, USER_SUBCOLLECTION_NAMES.bodyMetrics);
}

export async function addBodyMetricEntry(
  userId: string,
  entry: Omit<BodyMetricEntry, 'createdAt'>,
): Promise<string> {
  const createdEntry = await addDoc(buildBodyMetricsCollection(userId), {
    ...toBodyMetricDocumentFields(entry),
    createdAt: serverTimestamp(),
  });

  return createdEntry.id;
}

/**
 * The most recent entries, newest first.
 *
 * Ordered by `recordedOn` rather than `createdAt`, because a weight typed in on
 * Tuesday for Sunday belongs on Sunday. ISO dates sort correctly as strings,
 * which is most of why the field is stored as one.
 */
export async function readRecentBodyMetricEntries(
  userId: string,
  maximumCount: number,
): Promise<BodyMetricEntry[]> {
  const recentEntries = await getDocs(
    query(buildBodyMetricsCollection(userId), orderBy('recordedOn', 'desc'), limit(maximumCount)),
  );

  return recentEntries.docs.map((entryDocument) =>
    fromBodyMetricDocument(entryDocument.id, entryDocument.data()),
  );
}
