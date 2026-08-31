import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Unsubscribe,
} from 'firebase/auth';

import type { SignedInUser } from '@/types/authenticationTypes';

import { firebaseAuthentication } from '../firebase/firebaseApp';
import { isPopupUnavailableError } from './popupSignInFallback';
import { mapFirebaseUserToSignedInUser } from './signedInUserMapping';

/**
 * Google is the only provider: no email/password, no anonymous auth. One person
 * uses this app. See docs/SETUP_FIREBASE.md step 2.
 */
const googleAuthenticationProvider = new GoogleAuthProvider();

/**
 * Signs in with Google, preferring the popup and falling back to a redirect.
 *
 * The popup keeps the app mounted, which is the nicer experience. When the
 * browser refuses to open one, the redirect always works at the cost of leaving
 * and returning to the page.
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(firebaseAuthentication, googleAuthenticationProvider);
  } catch (error) {
    if (!isPopupUnavailableError(error)) {
      throw error;
    }

    await signInWithRedirect(firebaseAuthentication, googleAuthenticationProvider);
  }
}

export async function signOutOfApplication(): Promise<void> {
  await signOut(firebaseAuthentication);
}

/**
 * Collects the result of a redirect sign-in, if the page was just returned to
 * from one.
 *
 * The success path does not need this — `observeSignedInUser` fires on its own
 * once the session is restored. It is called for the failure path, where an
 * `auth/unauthorized-domain` from the redirect would otherwise be swallowed and
 * the user would sit on the sign-in screen with no idea why nothing happened.
 */
export async function collectRedirectSignInResult(): Promise<void> {
  await getRedirectResult(firebaseAuthentication);
}

/**
 * Watches who is signed in, for as long as the app is open.
 *
 * Fires once shortly after start-up with the restored session (or null), and
 * again on every subsequent sign-in and sign-out. Returns the unsubscribe.
 */
export function observeSignedInUser(
  handleSignedInUserChanged: (signedInUser: SignedInUser | null) => void,
): Unsubscribe {
  return onAuthStateChanged(firebaseAuthentication, (firebaseUser) => {
    handleSignedInUserChanged(
      firebaseUser === null ? null : mapFirebaseUserToSignedInUser(firebaseUser),
    );
  });
}
