import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { buildUserDocumentReference } from './userCollectionPaths';

/**
 * `users/{userId}` — the root document everything else hangs off.
 *
 * It holds almost nothing itself. Its job is to exist, so that the single rule
 * in `firestore.rules` has a subtree to protect.
 */

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
  const userDocumentReference = buildUserDocumentReference(userId);
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
