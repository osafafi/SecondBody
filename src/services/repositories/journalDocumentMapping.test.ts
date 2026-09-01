import { describe, expect, it } from 'vitest';

import { fromJournalEntryDocument, toJournalEntryDocumentFields } from './journalDocumentMapping';

function buildFakeTimestamp(isoString: string) {
  return { toDate: () => new Date(isoString) };
}

function buildStoredFields(changes: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    bodyText: 'Knee was quiet today. First time in a month.',
    entryKind: 'reflection',
    aboutDate: '2026-09-01',
    writtenAt: buildFakeTimestamp('2026-09-01T18:40:00.000Z'),
    aboutSessionId: 'session-abc',
    aboutExerciseId: 'legPress',
    reviewStatus: 'awaitingReview',
    reviewedAt: null,
    ...changes,
  };
}

describe('reading a journal entry', () => {
  it('reads a full entry back', () => {
    const entry = fromJournalEntryDocument('entry-1', buildStoredFields());

    expect(entry.bodyText).toBe('Knee was quiet today. First time in a month.');
    expect(entry.entryKind).toBe('reflection');
    expect(entry.aboutDate).toBe('2026-09-01');
    expect(entry.writtenAt).toEqual(new Date('2026-09-01T18:40:00.000Z'));
    expect(entry.aboutSessionId).toBe('session-abc');
    expect(entry.aboutExerciseId).toBe('legPress');
    expect(entry.reviewStatus).toBe('awaitingReview');
    expect(entry.reviewedAt).toBeNull();
  });

  it('reads an untagged entry', () => {
    const entry = fromJournalEntryDocument(
      'entry-1',
      buildStoredFields({ aboutSessionId: null, aboutExerciseId: null }),
    );

    expect(entry.aboutSessionId).toBeNull();
    expect(entry.aboutExerciseId).toBeNull();
  });

  it('keeps the line breaks the person typed', () => {
    const writtenText = 'Two things.\n\n1. Shoulder clicked.\n2. Sleep was bad.';

    const entry = fromJournalEntryDocument('entry-1', buildStoredFields({ bodyText: writtenText }));

    expect(entry.bodyText).toBe(writtenText);
  });

  it('reads an entry a review has already been through', () => {
    const entry = fromJournalEntryDocument(
      'entry-1',
      buildStoredFields({
        reviewStatus: 'reviewed',
        reviewedAt: buildFakeTimestamp('2026-09-07T20:00:00.000Z'),
      }),
    );

    expect(entry.reviewStatus).toBe('reviewed');
    expect(entry.reviewedAt).toEqual(new Date('2026-09-07T20:00:00.000Z'));
  });

  /*
   * The rule this collection does not share with the others. An entry is what
   * somebody actually wrote, so a tag a later release renamed must not be able
   * to take the text down with it.
   */
  it('keeps the text when the kind is one this release does not know', () => {
    const entry = fromJournalEntryDocument('entry-1', buildStoredFields({ entryKind: 'rant' }));

    expect(entry.bodyText).toBe('Knee was quiet today. First time in a month.');
    expect(entry.entryKind).toBe('reflection');
  });

  it('treats an unreadable review status as not yet reviewed', () => {
    const entry = fromJournalEntryDocument(
      'entry-1',
      buildStoredFields({ reviewStatus: 'halfLookedAt' }),
    );

    expect(entry.reviewStatus).toBe('awaitingReview');
  });

  it('treats a missing review status as not yet reviewed', () => {
    const { reviewStatus: _unused, ...fieldsWithoutStatus } = buildStoredFields();

    expect(fromJournalEntryDocument('entry-1', fieldsWithoutStatus).reviewStatus).toBe(
      'awaitingReview',
    );
  });

  it('names the document when the text itself is missing', () => {
    const { bodyText: _unused, ...fieldsWithoutText } = buildStoredFields();

    expect(() => fromJournalEntryDocument('entry-9', fieldsWithoutText)).toThrow(
      /journalEntries\/entry-9.*bodyText/,
    );
  });

  it('names the document when the date is not a date', () => {
    expect(() =>
      fromJournalEntryDocument('entry-9', buildStoredFields({ aboutDate: '2026-13-45' })),
    ).toThrow(/journalEntries\/entry-9.*aboutDate/);
  });
});

describe('writing a journal entry', () => {
  it('sends every field except the server-written timestamp', () => {
    const fields = toJournalEntryDocumentFields({
      bodyText: 'Felt strong.',
      entryKind: 'reflection',
      aboutDate: '2026-09-01',
      aboutSessionId: 'session-abc',
      aboutExerciseId: null,
      reviewStatus: 'awaitingReview',
      reviewedAt: null,
    });

    expect(fields).toEqual({
      bodyText: 'Felt strong.',
      entryKind: 'reflection',
      aboutDate: '2026-09-01',
      aboutSessionId: 'session-abc',
      aboutExerciseId: null,
      reviewStatus: 'awaitingReview',
      reviewedAt: null,
    });
  });

  it('round-trips through a stored document unchanged', () => {
    const original = fromJournalEntryDocument('entry-1', buildStoredFields());

    const readBack = fromJournalEntryDocument('entry-1', {
      ...toJournalEntryDocumentFields(original),
      writtenAt: buildFakeTimestamp('2026-09-01T18:40:00.000Z'),
    });

    expect(readBack).toEqual(original);
  });
});
