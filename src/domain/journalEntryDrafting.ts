import type { JournalEntry, JournalEntryKind } from '@/types/journalTypes';

/**
 * What a usable journal entry is, and what a draft turns into once it is one.
 *
 * The rules here are deliberately few. This is the one place in the app where
 * the user is writing prose rather than answering a question, and a validator
 * that argues with someone trying to write down that their knee hurt is a
 * validator that stops them writing anything. So there are exactly two limits:
 * an entry has to say something, and it has to be small enough to store.
 */

/**
 * The longest an entry may be.
 *
 * Firestore's document limit is a megabyte, so this is nowhere near a technical
 * bound — it is the length past which a note stops being a note. It is enforced
 * because the alternative is a pasted article silently becoming part of every
 * coaching bundle from then on.
 */
export const MAXIMUM_JOURNAL_ENTRY_CHARACTERS = 4000;

/** What the composer holds before it is saved. */
export type JournalEntryDraft = {
  bodyText: string;
  entryKind: JournalEntryKind;

  /** ISO `YYYY-MM-DD`. The day the entry is about, which is usually today. */
  aboutDate: string;

  aboutSessionId: string | null;
  aboutExerciseId: string | null;
};

/** `YYYY-MM-DD`. The same shape `firestoreDocumentReading` insists on. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * What is wrong with a draft, as sentences to show the user. Empty means it is
 * fine.
 *
 * `todayIsoDate` is passed in because nothing in `src/domain/` reads a clock,
 * and because "is this date in the future" is a question about the user's
 * calendar rather than about UTC.
 */
export function findJournalEntryProblems(draft: JournalEntryDraft, todayIsoDate: string): string[] {
  const problems: string[] = [];

  if (draft.bodyText.trim().length === 0) {
    problems.push('Write something first.');
  }

  if (draft.bodyText.length > MAXIMUM_JOURNAL_ENTRY_CHARACTERS) {
    problems.push(
      `That is longer than ${String(MAXIMUM_JOURNAL_ENTRY_CHARACTERS)} characters. Split it into two notes.`,
    );
  }

  if (!ISO_DATE_PATTERN.test(draft.aboutDate)) {
    problems.push('That is not a date.');
  } else if (draft.aboutDate > todayIsoDate) {
    /*
     * ISO dates compare correctly as strings, which is most of why they are
     * stored as strings. A future date is refused because an entry dated
     * forwards would sit at the top of the journal until the day it names.
     */
    problems.push('You cannot write up a day that has not happened yet.');
  }

  return problems;
}

/**
 * The document to store, from a draft that has already passed validation.
 *
 * `writtenAt` is absent because the repository writes it with a server
 * timestamp — the same split as every other write in this app.
 *
 * The body text is trimmed at its ends and **nowhere else**. Leading and
 * trailing whitespace is an artefact of a textarea; the line breaks inside it
 * are how the person wrote it, and CLAUDE.md's rule about storing what was
 * actually said starts here.
 */
export function buildJournalEntryToStore(
  draft: JournalEntryDraft,
): Omit<JournalEntry, 'writtenAt'> {
  return {
    bodyText: draft.bodyText.trim(),
    entryKind: draft.entryKind,
    aboutDate: draft.aboutDate,
    aboutSessionId: draft.aboutSessionId,

    /*
     * An exercise tag without a session is allowed: "my knee clicks on leg
     * press" is a fact about a movement rather than about one afternoon.
     */
    aboutExerciseId: draft.aboutExerciseId,

    reviewStatus: 'awaitingReview',
    reviewedAt: null,
  };
}
