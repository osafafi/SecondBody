/**
 * The training journal: what Omar writes down during the week.
 *
 * This is the capture half of the coaching loop described in docs/PROGRESS.md
 * under M10. The app stores what he actually wrote, **verbatim and never
 * summarised**, and `src/domain/coachingBundle.ts` gathers it up later so a
 * conversation about training can start from what was said at the time rather
 * than from what he remembers on a Sunday evening.
 *
 * Instants are `Date` and calendar days are ISO date strings, for the same
 * reasons as everywhere else — see `dailyTrackingTypes.ts`.
 */

/**
 * What kind of thing an entry is.
 *
 * Three, not ten. The point of the tag is that a review can tell a question
 * that wants answering from a note that wants reading, and a longer list would
 * be a taxonomy to think about in a car park after a session.
 */
export const JOURNAL_ENTRY_KINDS = ['reflection', 'question', 'concern'] as const;
export type JournalEntryKind = (typeof JOURNAL_ENTRY_KINDS)[number];

/**
 * Whether an entry has been through a coaching review yet.
 *
 * Everything is written as `awaitingReview`. **Nothing flips it to `reviewed`
 * yet**, and that is deliberate rather than unfinished: storing what a review
 * concluded is the write-back half of this idea, which is explicitly not
 * scheduled — see the M10 section of docs/PROGRESS.md. The field is written
 * from the first entry anyway, because adding it later would mean backfilling
 * every document that predates it, and `readJournalEntriesAwaitingReview`
 * already reads it.
 */
export const JOURNAL_REVIEW_STATUSES = ['awaitingReview', 'reviewed'] as const;
export type JournalReviewStatus = (typeof JOURNAL_REVIEW_STATUSES)[number];

/**
 * `users/{userId}/journalEntries/{entryId}`.
 *
 * Append-only. An entry is a record of what someone thought on a day, and
 * editing one afterwards would quietly rewrite the history a review reads.
 */
export type JournalEntry = {
  /**
   * What he wrote, exactly as he wrote it.
   *
   * Not trimmed of its paragraph breaks, not shortened, not tidied. The whole
   * value of this collection is that it is the raw thing.
   */
  bodyText: string;

  entryKind: JournalEntryKind;

  /**
   * The day the entry is about, ISO `YYYY-MM-DD`.
   *
   * Usually today. It is stored separately from `writtenAt` because an entry
   * typed out at ten past midnight is about the session that finished at nine,
   * and a review that read the instant would file it on the wrong day.
   */
  aboutDate: string;

  /** When it was saved. */
  writtenAt: Date;

  /**
   * The `workoutSessions` document this is about, or null.
   *
   * A document id rather than a copy of the session, so a note about a session
   * still points at it after the session is rewritten by a later set.
   */
  aboutSessionId: string | null;

  /** An exercise in `src/content/exercises/`, or null. */
  aboutExerciseId: string | null;

  reviewStatus: JournalReviewStatus;

  /** Null until a review has looked at it. See `JOURNAL_REVIEW_STATUSES`. */
  reviewedAt: Date | null;
};
