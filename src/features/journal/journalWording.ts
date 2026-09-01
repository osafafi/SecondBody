import { countCalendarDaysBetween, parseIsoDate } from '@/domain/calendarDates';
import type { JournalEntryKind } from '@/types/journalTypes';

/**
 * Turning journal entries into the words the screen uses.
 *
 * Labels, not coach copy. Harout's lines live in
 * `src/content/coachVoice/journalCoachLines.ts` and nothing in here has a tone.
 */

const DAY_AND_MONTH_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/**
 * What each kind of entry is called, and the hint under the picker.
 *
 * The hints are the whole reason the three kinds exist. Without them "concern"
 * reads as a bigger word than it is, and the one thing this screen must not do
 * is make writing "my shoulder clicked" feel like filing a report.
 */
export const JOURNAL_ENTRY_KIND_LABELS: Readonly<Record<JournalEntryKind, string>> = {
  reflection: 'Note',
  question: 'Question',
  concern: 'Concern',
};

export const JOURNAL_ENTRY_KIND_HINTS: Readonly<Record<JournalEntryKind, string>> = {
  reflection: 'How it went, what you noticed.',
  question: 'Something you want an answer to.',
  concern: 'Something that hurt, or that you are not happy about.',
};

/**
 * How to refer to the day an entry is about.
 *
 * Named days for the last few, because "yesterday" is instantly readable and a
 * date needs arithmetic. Past that the full date, because "Tuesday" three weeks
 * back is ambiguous.
 */
export function describeEntryDate(aboutDate: string, todayIsoDate: string): string {
  if (aboutDate === todayIsoDate) {
    return 'Today';
  }

  const daysAgo = countCalendarDaysBetween(parseIsoDate(aboutDate), parseIsoDate(todayIsoDate));

  if (daysAgo === 1) {
    return 'Yesterday';
  }

  return DAY_AND_MONTH_FORMATTER.format(parseIsoDate(aboutDate));
}

/** "3 notes", "1 note". The count in the journal's own header. */
export function describeEntryCount(entryCount: number): string {
  return entryCount === 1 ? '1 note' : `${String(entryCount)} notes`;
}

/**
 * What an entry is tagged with, as one phrase, or null when it is tagged with
 * nothing.
 *
 * Null rather than an empty string, so the component renders no chip at all
 * rather than an empty one — most entries are about the week in general and a
 * row of blank tags would be noise on every one of them.
 */
export function describeEntryTags(
  sessionLabel: string | null,
  exerciseName: string | null,
): string | null {
  const tags = [sessionLabel, exerciseName].filter((tag): tag is string => tag !== null);

  return tags.length === 0 ? null : tags.join(' · ');
}
