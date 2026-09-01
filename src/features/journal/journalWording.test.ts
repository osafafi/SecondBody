import { describe, expect, it } from 'vitest';

import { describeEntryCount, describeEntryDate, describeEntryTags } from './journalWording';

describe('describing the day an entry is about', () => {
  it('calls today today', () => {
    expect(describeEntryDate('2026-09-01', '2026-09-01')).toBe('Today');
  });

  it('calls the day before yesterday', () => {
    expect(describeEntryDate('2026-08-31', '2026-09-01')).toBe('Yesterday');
  });

  it('gives the full date once a named day would be ambiguous', () => {
    expect(describeEntryDate('2026-08-20', '2026-09-01')).toBe('Thursday 20 August');
  });

  /*
   * `new Date('2026-08-31')` parses as midnight UTC, which is the previous
   * evening anywhere west of Greenwich. `parseIsoDate` is the reason this is a
   * test rather than a bug found in a different timezone.
   */
  it('reads the date in the local calendar', () => {
    expect(describeEntryDate('2026-08-31', '2026-08-31')).toBe('Today');
  });
});

describe('counting entries', () => {
  it('says one note without a plural', () => {
    expect(describeEntryCount(1)).toBe('1 note');
  });

  it('pluralises everything else', () => {
    expect(describeEntryCount(0)).toBe('0 notes');
    expect(describeEntryCount(4)).toBe('4 notes');
  });
});

describe('describing what an entry is tagged with', () => {
  it('joins a session and an exercise', () => {
    expect(describeEntryTags('Session A, week 5', 'Leg press')).toBe(
      'Session A, week 5 · Leg press',
    );
  });

  it('says just the one it has', () => {
    expect(describeEntryTags('Session A, week 5', null)).toBe('Session A, week 5');
    expect(describeEntryTags(null, 'Leg press')).toBe('Leg press');
  });

  it('says nothing at all rather than an empty phrase', () => {
    expect(describeEntryTags(null, null)).toBeNull();
  });
});
