import { describe, expect, it } from 'vitest';

import {
  buildJournalEntryToStore,
  findJournalEntryProblems,
  MAXIMUM_JOURNAL_ENTRY_CHARACTERS,
  type JournalEntryDraft,
} from './journalEntryDrafting';

const TODAY = '2026-09-01';

function buildDraft(changes: Partial<JournalEntryDraft> = {}): JournalEntryDraft {
  return {
    bodyText: 'Left knee felt fine on leg press today for the first time in weeks.',
    entryKind: 'reflection',
    aboutDate: TODAY,
    aboutSessionId: null,
    aboutExerciseId: null,
    ...changes,
  };
}

describe('deciding whether a draft can be saved', () => {
  it('accepts an ordinary note', () => {
    expect(findJournalEntryProblems(buildDraft(), TODAY)).toEqual([]);
  });

  it('refuses an entry that says nothing', () => {
    expect(findJournalEntryProblems(buildDraft({ bodyText: '' }), TODAY)).toEqual([
      'Write something first.',
    ]);
  });

  it('treats whitespace as saying nothing', () => {
    expect(findJournalEntryProblems(buildDraft({ bodyText: '   \n\t  ' }), TODAY)).toEqual([
      'Write something first.',
    ]);
  });

  it('accepts an entry exactly at the length limit', () => {
    const draft = buildDraft({ bodyText: 'x'.repeat(MAXIMUM_JOURNAL_ENTRY_CHARACTERS) });

    expect(findJournalEntryProblems(draft, TODAY)).toEqual([]);
  });

  it('refuses one character more than the limit', () => {
    const draft = buildDraft({ bodyText: 'x'.repeat(MAXIMUM_JOURNAL_ENTRY_CHARACTERS + 1) });

    expect(findJournalEntryProblems(draft, TODAY)).toEqual([
      'That is longer than 4000 characters. Split it into two notes.',
    ]);
  });

  it('accepts a note written up about an earlier day', () => {
    expect(findJournalEntryProblems(buildDraft({ aboutDate: '2026-08-30' }), TODAY)).toEqual([]);
  });

  it('refuses a day that has not happened yet', () => {
    expect(findJournalEntryProblems(buildDraft({ aboutDate: '2026-09-02' }), TODAY)).toEqual([
      'You cannot write up a day that has not happened yet.',
    ]);
  });

  it('refuses something that is not a date at all', () => {
    expect(findJournalEntryProblems(buildDraft({ aboutDate: 'yesterday' }), TODAY)).toEqual([
      'That is not a date.',
    ]);
  });

  it('reports every problem at once rather than one at a time', () => {
    const draft = buildDraft({ bodyText: '', aboutDate: '2027-01-01' });

    expect(findJournalEntryProblems(draft, TODAY)).toHaveLength(2);
  });
});

describe('turning a draft into a document', () => {
  it('stores what was written, trimmed only at its ends', () => {
    const entry = buildJournalEntryToStore(
      buildDraft({ bodyText: '\n  Shoulder felt tight.\n\nBetter after the second set.  \n' }),
    );

    expect(entry.bodyText).toBe('Shoulder felt tight.\n\nBetter after the second set.');
  });

  it('never rewrites the middle of what was said', () => {
    const verbatimText = 'Knee   hurt.\n\n\nProbably   the seat height?';

    expect(buildJournalEntryToStore(buildDraft({ bodyText: verbatimText })).bodyText).toBe(
      verbatimText,
    );
  });

  it('carries the tags through', () => {
    const entry = buildJournalEntryToStore(
      buildDraft({
        entryKind: 'concern',
        aboutSessionId: 'session-abc',
        aboutExerciseId: 'legPress',
      }),
    );

    expect(entry.entryKind).toBe('concern');
    expect(entry.aboutSessionId).toBe('session-abc');
    expect(entry.aboutExerciseId).toBe('legPress');
  });

  it('allows an exercise tag with no session behind it', () => {
    const entry = buildJournalEntryToStore(buildDraft({ aboutExerciseId: 'legPress' }));

    expect(entry.aboutSessionId).toBeNull();
    expect(entry.aboutExerciseId).toBe('legPress');
  });

  it('starts every entry awaiting review', () => {
    const entry = buildJournalEntryToStore(buildDraft());

    expect(entry.reviewStatus).toBe('awaitingReview');
    expect(entry.reviewedAt).toBeNull();
  });
});
