import { getDoc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from 'firebase/firestore';

import type { UserProfile } from '@/types/userAccountTypes';

import { fromUserProfileDocument, toUserProfileDocumentFields } from './userAccountDocumentMapping';
import {
  SINGLETON_DOCUMENT_ID,
  USER_SUBCOLLECTION_NAMES,
  buildUserSubdocumentReference,
} from './userCollectionPaths';

/**
 * `users/{userId}/profile/current` — who this person is, and what the programme
 * is allowed to ask of them.
 *
 * Thin on purpose. Everything with a decision in it lives in
 * `userAccountDocumentMapping.ts`, which is where the tests are.
 */

function buildProfileReference(userId: string) {
  return buildUserSubdocumentReference(
    userId,
    USER_SUBCOLLECTION_NAMES.profile,
    SINGLETON_DOCUMENT_ID,
  );
}

/** Null before onboarding has been completed, which is the app's first fork. */
export async function readUserProfile(userId: string): Promise<UserProfile | null> {
  const profileDocument = await getDoc(buildProfileReference(userId));

  return profileDocument.exists() ? fromUserProfileDocument(profileDocument.data()) : null;
}

/**
 * Watches the profile for as long as the app is open.
 *
 * A subscription rather than a one-shot read, for three reasons. Firestore's
 * local cache makes the first callback effectively instant and then corrects it
 * from the server, which is the behaviour a gym with one bar of signal wants.
 * A write from onboarding re-fires it automatically, so nothing has to remember
 * to refetch. And it is the shape React actually wants an effect to have —
 * subscribe, and set state from the callback.
 *
 * Reading throws on a malformed document, which inside a snapshot callback would
 * otherwise surface as an unhandled error rather than something the screen can
 * report, so it is routed to `handleProfileReadFailed` like any other failure.
 */
export function observeUserProfile(
  userId: string,
  handleProfileChanged: (profile: UserProfile | null) => void,
  handleProfileReadFailed: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    buildProfileReference(userId),
    (profileDocument) => {
      try {
        handleProfileChanged(
          profileDocument.exists() ? fromUserProfileDocument(profileDocument.data()) : null,
        );
      } catch (error: unknown) {
        handleProfileReadFailed(error);
      }
    },
    handleProfileReadFailed,
  );
}

/**
 * Writes the profile onboarding produced.
 *
 * `createdAt` is only set when the document is new, for the same reason as in
 * `userDocumentRepository`: "training since" should mean the first time, not the
 * most recent write.
 */
export async function writeUserProfile(
  userId: string,
  profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const profileReference = buildProfileReference(userId);
  const existingProfile = await getDoc(profileReference);

  await setDoc(
    profileReference,
    {
      ...toUserProfileDocumentFields(profile),
      ...(existingProfile.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
