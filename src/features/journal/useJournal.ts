import { useCallback, useEffect, useState } from 'react';

import type { JournalEntryDraft } from '@/domain/journalEntryDrafting';
import { buildJournalEntryToStore } from '@/domain/journalEntryDrafting';
import {
  addJournalEntry,
  readRecentJournalEntries,
} from '@/services/repositories/journalEntriesRepository';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import { readUserSettings } from '@/services/repositories/userSettingsRepository';
import { readRecentWorkoutSessions } from '@/services/repositories/workoutSessionRepository';
import type { JournalEntry } from '@/types/journalTypes';
import type { WithDocumentId, WorkoutSession } from '@/types/trainingHistoryTypes';
import type { UserSettings } from '@/types/userAccountTypes';

/**
 * The journal, read once and appended to.
 *
 * Three reads, because the screen needs three things: what has already been
 * written, enough recent sessions to offer as tags, and how much of Harout the
 * user asked for. They go out together in one `Promise.all` so the screen has
 * one loading state rather than a composer that appears before the tag picker
 * it contains.
 *
 * The preferences document is read here rather than through
 * `useTrainingOverview`, which also has it. That hook additionally reads the
 * programme assignment and forty sessions, and nothing on this screen wants
 * either — paying for both to render one line would be a poor trade on a screen
 * somebody opened to type a sentence.
 *
 * Deliberately not folded into `useTrainingOverview` for the mirror-image
 * reason: Today and Schedule open on every launch and neither shows a journal
 * entry.
 */

/**
 * How much of the journal the screen shows.
 *
 * Two months of writing at a note every couple of days, which is far more than
 * anyone scrolls back through. The bundle does not use this number — the export
 * has its own, larger, bound.
 */
const RECENT_JOURNAL_ENTRY_COUNT = 40;

/**
 * How many recent sessions can be tagged.
 *
 * A fortnight of training, because a note is written about a session while it
 * is still recent. Offering three months of them would turn a two-tap tag into
 * a scroll through a list.
 */
const TAGGABLE_SESSION_COUNT = 6;

export type JournalStatus = 'loading' | 'ready' | 'failed';

export type JournalState = {
  journalStatus: JournalStatus;

  /** Newest first. Non-null only when the status is `ready`. */
  journalEntries: WithDocumentId<JournalEntry>[] | null;

  /** Recent sessions offered as tags, newest first. Empty before the first one. */
  taggableSessions: WithDocumentId<WorkoutSession>[];

  /** The stored preferences, or null until they have been read. */
  userSettings: UserSettings | null;

  journalErrorMessage: string | null;

  isSavingEntry: boolean;

  saveErrorMessage: string | null;

  /**
   * Bumped once per entry that actually landed.
   *
   * The composer is keyed on it, so a successful save empties the form by
   * remounting it. A counter rather than the reload counter, which also moves
   * when somebody retries a failed read and must not throw away what they have
   * typed.
   */
  savedEntryCount: number;

  reloadJournal: () => void;

  saveJournalEntry: (draft: JournalEntryDraft) => void;
};

/** The same owner-tagged shape as the other hooks in this app, for the same reason. */
type CompletedRead = {
  forUserId: string;
  forReloadCounter: number;

  status: 'ready' | 'failed';
  journalEntries: WithDocumentId<JournalEntry>[];
  taggableSessions: WithDocumentId<WorkoutSession>[];
  userSettings: UserSettings | null;
  errorMessage: string | null;
};

/** Pass null while the signed-in user is not known yet; nothing is read. */
export function useJournal(userId: string | null): JournalState {
  const [completedRead, setCompletedRead] = useState<CompletedRead | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [savedEntryCount, setSavedEntryCount] = useState(0);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const reloadJournal = useCallback(() => {
    setSaveErrorMessage(null);
    setReloadCounter((previousCounter) => previousCounter + 1);
  }, []);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let isCurrentRequest = true;

    const loadJournal = async () => {
      try {
        const [journalEntries, recentSessions, userSettings] = await Promise.all([
          readRecentJournalEntries(userId, RECENT_JOURNAL_ENTRY_COUNT),
          readRecentWorkoutSessions(userId, TAGGABLE_SESSION_COUNT),
          readUserSettings(userId),
        ]);

        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'ready',
          journalEntries,
          taggableSessions: recentSessions,
          userSettings,
          errorMessage: null,
        });
      } catch (error: unknown) {
        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'failed',
          journalEntries: [],
          taggableSessions: [],
          userSettings: null,
          errorMessage: describeRepositoryError(error),
        });
      }
    };

    void loadJournal();

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, reloadCounter]);

  const isCompletedReadCurrent =
    completedRead !== null &&
    completedRead.forUserId === userId &&
    completedRead.forReloadCounter === reloadCounter;

  /**
   * Appends an entry, and shows it only once it is actually stored.
   *
   * The one write in this app that is **not** optimistic, and the difference
   * matters. A tick that rolls back has cost nobody anything; a paragraph that
   * appears in the list, then vanishes because the write failed, has thrown
   * away something that only existed in the person's head. So the composer
   * keeps what was typed until Firestore has taken it.
   */
  const saveJournalEntry = useCallback(
    (draft: JournalEntryDraft) => {
      if (userId === null || !isCompletedReadCurrent || completedRead.status !== 'ready') {
        return;
      }

      const previousRead = completedRead;
      const entryToStore = buildJournalEntryToStore(draft);

      setSaveErrorMessage(null);
      setIsSavingEntry(true);

      void addJournalEntry(userId, entryToStore)
        .then((documentId) => {
          setCompletedRead({
            ...previousRead,
            /*
             * `writtenAt` is a server timestamp, so what was written is not
             * known here. The local clock is close enough to keep the list in
             * order until the next read, and it is never stored — the document
             * carries the server's value.
             */
            journalEntries: [
              { ...entryToStore, writtenAt: new Date(), documentId },
              ...previousRead.journalEntries,
            ],
          });

          setSavedEntryCount((previousCount) => previousCount + 1);
        })
        .catch((error: unknown) => {
          setSaveErrorMessage(describeRepositoryError(error));
        })
        .finally(() => {
          setIsSavingEntry(false);
        });
    },
    [userId, completedRead, isCompletedReadCurrent],
  );

  if (!isCompletedReadCurrent) {
    return {
      journalStatus: 'loading',
      journalEntries: null,
      taggableSessions: [],
      userSettings: null,
      journalErrorMessage: null,
      isSavingEntry,
      saveErrorMessage,
      savedEntryCount,
      reloadJournal,
      saveJournalEntry,
    };
  }

  return {
    journalStatus: completedRead.status,
    journalEntries: completedRead.status === 'ready' ? completedRead.journalEntries : null,
    taggableSessions: completedRead.taggableSessions,
    userSettings: completedRead.userSettings,
    journalErrorMessage: completedRead.errorMessage,
    isSavingEntry,
    saveErrorMessage,
    savedEntryCount,
    reloadJournal,
    saveJournalEntry,
  };
}
