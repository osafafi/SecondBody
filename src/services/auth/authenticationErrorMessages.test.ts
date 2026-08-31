import { describe, expect, it } from 'vitest';

import {
  describeAuthenticationError,
  isUserCancelledSignIn,
  readErrorCode,
} from './authenticationErrorMessages';

describe('reading a Firebase error code', () => {
  it('finds the code on a Firebase-shaped error', () => {
    expect(readErrorCode({ code: 'auth/unauthorized-domain' })).toBe('auth/unauthorized-domain');
  });

  it('returns null for anything without a string code', () => {
    expect(readErrorCode(new Error('boom'))).toBeNull();
    expect(readErrorCode({ code: 7 })).toBeNull();
    expect(readErrorCode(null)).toBeNull();
    expect(readErrorCode('auth/unauthorized-domain')).toBeNull();
  });
});

describe('describing an authentication failure', () => {
  it('names the domain restriction, because that is the one worth explaining', () => {
    expect(describeAuthenticationError({ code: 'auth/unauthorized-domain' })).toContain(
      'approved list',
    );
  });

  it('points at the console when the provider is switched off', () => {
    expect(describeAuthenticationError({ code: 'auth/operation-not-allowed' })).toContain(
      'Firebase console',
    );
  });

  it('points at the rules when Firestore refuses a write', () => {
    expect(describeAuthenticationError({ code: 'permission-denied' })).toContain('security rules');
  });

  it('always produces a sentence, even for an unrecognised failure', () => {
    expect(describeAuthenticationError({ code: 'auth/something-new' })).not.toBe('');
    expect(describeAuthenticationError(new Error('boom'))).not.toBe('');
    expect(describeAuthenticationError(undefined)).not.toBe('');
  });
});

describe('spotting a cancelled sign-in', () => {
  it('recognises both ways a user can back out', () => {
    expect(isUserCancelledSignIn({ code: 'auth/popup-closed-by-user' })).toBe(true);
    expect(isUserCancelledSignIn({ code: 'auth/cancelled-popup-request' })).toBe(true);
  });

  it('does not mistake a real failure for a cancellation', () => {
    expect(isUserCancelledSignIn({ code: 'auth/unauthorized-domain' })).toBe(false);
    expect(isUserCancelledSignIn(new Error('boom'))).toBe(false);
  });
});
