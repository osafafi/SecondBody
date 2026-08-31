import type { User } from 'firebase/auth';

import type { SignedInUser } from '@/types/authenticationTypes';

/**
 * The only parts of Firebase's `User` this mapping reads.
 *
 * Narrowed with `Pick` rather than taking the whole `User`, so the unit test can
 * hand it a plain object literal instead of constructing — or casting its way to
 * — a full Firebase user.
 */
export type MappableFirebaseUser = Pick<User, 'uid' | 'displayName' | 'email' | 'photoURL'>;

/**
 * Narrows Firebase's user down to the four fields the application uses.
 *
 * Firebase reports an absent field as null in some sign-in flows and as an empty
 * string in others. Both become null here, so a screen rendering `displayName`
 * gets either a real name or nothing — never an empty string that silently
 * collapses the layout it sits in.
 */
export function mapFirebaseUserToSignedInUser(firebaseUser: MappableFirebaseUser): SignedInUser {
  return {
    userId: firebaseUser.uid,
    displayName: normaliseAbsentTextToNull(firebaseUser.displayName),
    emailAddress: normaliseAbsentTextToNull(firebaseUser.email),
    photoUrl: normaliseAbsentTextToNull(firebaseUser.photoURL),
  };
}

/** Empty and whitespace-only strings are absent values wearing a disguise. */
function normaliseAbsentTextToNull(value: string | null): string | null {
  const trimmedValue = value?.trim() ?? '';

  return trimmedValue.length > 0 ? trimmedValue : null;
}
