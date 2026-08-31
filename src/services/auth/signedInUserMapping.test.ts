import { describe, expect, it } from 'vitest';

import { mapFirebaseUserToSignedInUser } from './signedInUserMapping';

/**
 * The mapping between Firebase's user and the app's.
 *
 * The interesting part is not the field renaming, it is the normalisation:
 * Firebase reports a missing name as null in one flow and as an empty string in
 * another, and a screen cannot render "either a name or nothing" reliably unless
 * exactly one of those reaches it.
 */
describe('mapping a Firebase user to a signed-in user', () => {
  it('carries the uid across as the user id', () => {
    const signedInUser = mapFirebaseUserToSignedInUser({
      uid: 'abc123',
      displayName: 'Omar',
      email: 'omar@example.com',
      photoURL: 'https://example.com/avatar.png',
    });

    expect(signedInUser.userId).toBe('abc123');
  });

  it('keeps the fields a complete Google account provides', () => {
    const signedInUser = mapFirebaseUserToSignedInUser({
      uid: 'abc123',
      displayName: 'Omar',
      email: 'omar@example.com',
      photoURL: 'https://example.com/avatar.png',
    });

    expect(signedInUser).toEqual({
      userId: 'abc123',
      displayName: 'Omar',
      emailAddress: 'omar@example.com',
      photoUrl: 'https://example.com/avatar.png',
    });
  });

  it('reports genuinely absent fields as null', () => {
    const signedInUser = mapFirebaseUserToSignedInUser({
      uid: 'abc123',
      displayName: null,
      email: null,
      photoURL: null,
    });

    expect(signedInUser.displayName).toBeNull();
    expect(signedInUser.emailAddress).toBeNull();
    expect(signedInUser.photoUrl).toBeNull();
  });

  it('treats an empty string as absent rather than passing it through', () => {
    const signedInUser = mapFirebaseUserToSignedInUser({
      uid: 'abc123',
      displayName: '',
      email: '',
      photoURL: '',
    });

    expect(signedInUser.displayName).toBeNull();
    expect(signedInUser.emailAddress).toBeNull();
    expect(signedInUser.photoUrl).toBeNull();
  });

  it('treats a whitespace-only name as absent', () => {
    const signedInUser = mapFirebaseUserToSignedInUser({
      uid: 'abc123',
      displayName: '   ',
      email: 'omar@example.com',
      photoURL: null,
    });

    expect(signedInUser.displayName).toBeNull();
  });

  it('trims a name that arrives with surrounding whitespace', () => {
    const signedInUser = mapFirebaseUserToSignedInUser({
      uid: 'abc123',
      displayName: '  Omar  ',
      email: null,
      photoURL: null,
    });

    expect(signedInUser.displayName).toBe('Omar');
  });
});
