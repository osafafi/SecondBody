import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firestoreDatabase } from '../firebase/firebaseApp';

/** The single root collection. Everything else hangs off a user document. */
export const USERS_COLLECTION_NAME = 'users';

/**
 * Makes sure `users/{userId}` exists, and records that its owner was just here.
 *
 * Called once per sign-in. `createdAt` is written only when the document is
 * genuinely new: merging it on every launch would keep resetting the date, and
 * "training since" is a number worth keeping honest.
 *
 * One read and one write per sign-in — see docs/DATA_MODEL.md section 6 for why
 * that is not worth optimising.
 */
export async function ensureUserDocumentExists(userId: string): Promise<void> {
  const userDocumentReference = doc(firestoreDatabase, USERS_COLLECTION_NAME, userId);
  const existingUserDocument = await getDoc(userDocumentReference);

  if (existingUserDocument.exists()) {
    await setDoc(userDocumentReference, { lastActiveAt: serverTimestamp() }, { merge: true });

    return;
  }

  await setDoc(userDocumentReference, {
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });
}
