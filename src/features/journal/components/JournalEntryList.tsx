import { CircleHelp, MessageSquareWarning, NotebookPen } from 'lucide-react';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import type { JournalEntryKind } from '@/types/journalTypes';

import { describeEntryDate, describeEntryTags, JOURNAL_ENTRY_KIND_LABELS } from '../journalWording';
import styles from './JournalEntryList.module.css';

/** One entry, already resolved to labels by the screen. */
export type JournalEntryRow = {
  entryId: string;
  entryKind: JournalEntryKind;
  aboutDate: string;
  bodyText: string;

  /** "Session A, week 5", or null when the entry names no session. */
  sessionLabel: string | null;

  /** The exercise's name, or null. */
  exerciseName: string | null;
};

export type JournalEntryListProps = {
  entries: JournalEntryRow[];

  /** Today, from the screen's single reading of the clock. */
  todayIsoDate: string;

  /** One line from Harout, shown only when there is nothing written yet. */
  emptyStateCoachLine: string | null;
};

const KIND_ICONS: Readonly<Record<JournalEntryKind, typeof NotebookPen>> = {
  reflection: NotebookPen,
  question: CircleHelp,
  concern: MessageSquareWarning,
};

/**
 * What has been written, newest first.
 *
 * The text is rendered with its line breaks intact — `white-space: pre-wrap` in
 * the stylesheet — because the entry is stored verbatim and showing it
 * reflowed into one paragraph would quietly contradict that.
 *
 * There is no edit control and no delete control, and that is the collection's
 * design rather than an omission: an entry is a record of what somebody thought
 * on a day. See `journalEntriesRepository`.
 */
export function JournalEntryList({
  entries,
  todayIsoDate,
  emptyStateCoachLine,
}: JournalEntryListProps) {
  if (entries.length === 0) {
    return (
      <GradientSurface variant="outlined" radius="xlarge" className={styles.emptyPanel}>
        <h2 className={styles.emptyTitle}>Nothing written down yet</h2>
        <p className={styles.emptyBody}>
          {emptyStateCoachLine ??
            'Whatever you put here comes back when it is time to look at how the block went.'}
        </p>
      </GradientSurface>
    );
  }

  return (
    <ul className={styles.list}>
      {entries.map((entry) => {
        const KindIcon = KIND_ICONS[entry.entryKind];
        const tags = describeEntryTags(entry.sessionLabel, entry.exerciseName);

        return (
          <GradientSurface
            key={entry.entryId}
            as="li"
            variant="elevated"
            radius="large"
            className={styles.entry}
          >
            <div className={styles.entryHeader}>
              <span className={styles.entryKind}>
                <KindIcon size={14} strokeWidth={2} aria-hidden />
                {JOURNAL_ENTRY_KIND_LABELS[entry.entryKind]}
              </span>

              <span className={styles.entryDate}>
                {describeEntryDate(entry.aboutDate, todayIsoDate)}
              </span>
            </div>

            <p className={styles.entryBody}>{entry.bodyText}</p>

            {tags ? <p className={styles.entryTags}>{tags}</p> : null}
          </GradientSurface>
        );
      })}
    </ul>
  );
}
