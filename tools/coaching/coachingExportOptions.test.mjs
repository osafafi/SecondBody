import { describe, expect, it } from 'vitest';

import {
  describeAmbiguousAccounts,
  parseCoachingExportArguments,
  readProjectIdFromFirebaseRc,
} from './coachingExportOptions.mjs';

describe('reading the command line', () => {
  it('needs nothing, because there is only one account', () => {
    expect(parseCoachingExportArguments([])).toEqual({ userId: null, email: null });
  });

  it('takes a user id', () => {
    expect(parseCoachingExportArguments(['--user-id', 'abc123'])).toEqual({
      userId: 'abc123',
      email: null,
    });
  });

  it('takes an email address instead', () => {
    expect(parseCoachingExportArguments(['--email', 'someone@example.com'])).toEqual({
      userId: null,
      email: 'someone@example.com',
    });
  });

  it('refuses both at once rather than picking one', () => {
    expect(() => parseCoachingExportArguments(['--user-id', 'abc', '--email', 'a@b.c'])).toThrow(
      /not both/,
    );
  });

  it('refuses a flag with nothing after it', () => {
    expect(() => parseCoachingExportArguments(['--user-id'])).toThrow(/needs a value/);
  });

  /* `--user-id --email x` is a missing value, not an empty one. */
  it('refuses a flag followed by another flag', () => {
    expect(() => parseCoachingExportArguments(['--user-id', '--email'])).toThrow(/needs a value/);
  });

  it('names an argument it does not recognise', () => {
    expect(() => parseCoachingExportArguments(['--everything'])).toThrow(/--everything/);
  });
});

describe('finding the project', () => {
  it('reads the default project', () => {
    expect(readProjectIdFromFirebaseRc({ projects: { default: 'second-body-osi' } })).toBe(
      'second-body-osi',
    );
  });

  it('says so when there is no default project', () => {
    expect(() => readProjectIdFromFirebaseRc({ projects: {} })).toThrow(/no default project/);
    expect(() => readProjectIdFromFirebaseRc({})).toThrow(/no default project/);
  });
});

describe('explaining which account to export', () => {
  it('tells a new project to sign in first', () => {
    expect(describeAmbiguousAccounts(0)).toMatch(/Sign in to the app once/);
  });

  it('asks for a flag when there is more than one account', () => {
    expect(describeAmbiguousAccounts(3)).toMatch(/--user-id/);
  });
});
