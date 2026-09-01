import {
  JOURNAL_ENTRY_KINDS,
  JOURNAL_REVIEW_STATUSES,
  type JournalEntry,
} from '@/types/journalTypes';

import { createDocumentReader } from './firestoreDocumentReading';

/**
 * Translating journal entries between Firestore and the application's types.
 *
 * The rule this file follows that the others do not: **a journal entry is never
 * dropped and never rewritten.** Every other mapping in this folder has some
 * value it will refuse — a session with an unknown status throws, an unknown
 * equipment id is silently discarded. Neither is right here. The whole point of
 * the collection is that it is what the person actually wrote, so an entry with
 * a tag this release does not recognise still has to come back with its text
 * intact.
 *
 * So `entryKind` and `reviewStatus` fall back to their safest value rather than
 * throwing, and the fallback for the second one is `awaitingReview` — an entry
 * whose status cannot be read has not demonstrably been reviewed, and showing a
 * coach a note twice is a far better failure than never showing it at all.
 */

export function fromJournalEntryDocument(documentId: string, documentData: unknown): JournalEntry {
  const reader = createDocumentReader(`journalEntries/${documentId}`, documentData);

  return {
    /*
     * Required. There is no sensible default for the one field the document
     * exists to hold, and an entry that reads back as an empty string is worse
     * than an error naming the document.
     */
    bodyText: reader.requiredString('bodyText'),

    entryKind: reader.recognisedMemberOf('entryKind', JOURNAL_ENTRY_KINDS) ?? 'reflection',

    aboutDate: reader.requiredIsoDate('aboutDate'),
    writtenAt: reader.requiredInstant('writtenAt'),

    aboutSessionId: reader.optionalString('aboutSessionId'),
    aboutExerciseId: reader.optionalString('aboutExerciseId'),

    reviewStatus:
      reader.recognisedMemberOf('reviewStatus', JOURNAL_REVIEW_STATUSES) ?? 'awaitingReview',

    reviewedAt: reader.optionalInstant('reviewedAt'),
  };
}

/** Everything except `writtenAt`, which is written with a server timestamp. */
export function toJournalEntryDocumentFields(
  entry: Omit<JournalEntry, 'writtenAt'>,
): Record<string, unknown> {
  return {
    bodyText: entry.bodyText,
    entryKind: entry.entryKind,
    aboutDate: entry.aboutDate,
    aboutSessionId: entry.aboutSessionId,
    aboutExerciseId: entry.aboutExerciseId,
    reviewStatus: entry.reviewStatus,
    reviewedAt: entry.reviewedAt,
  };
}
