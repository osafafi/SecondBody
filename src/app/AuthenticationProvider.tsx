import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  describeAuthenticationError,
  isUserCancelledSignIn,
} from '@/services/auth/authenticationErrorMessages';
import {
  collectRedirectSignInResult,
  observeSignedInUser,
  signInWithGoogle,
  signOutOfApplication,
} from '@/services/auth/googleAuthenticationService';
import { ensureUserDocumentExists } from '@/services/repositories/userDocumentRepository';
import type { AuthenticationStatus, SignedInUser } from '@/types/authenticationTypes';

import { AuthenticationContext, type AuthenticationContextValue } from './authenticationContext';

type AuthenticationProviderProps = {
  children: ReactNode;
};

/**
 * Holds who is signed in, and makes sure their user document exists.
 *
 * Mounted above the router, so every screen can assume the answer is already
 * known by the time it renders. The status starts at `checking` rather than
 * `signedOut` because Firebase restores a persisted session asynchronously —
 * see `AuthenticationStatus` in `src/types/authenticationTypes.ts`.
 */
export function AuthenticationProvider({ children }: AuthenticationProviderProps) {
  const [authenticationStatus, setAuthenticationStatus] =
    useState<AuthenticationStatus>('checking');
  const [signedInUser, setSignedInUser] = useState<SignedInUser | null>(null);
  const [authenticationErrorMessage, setAuthenticationErrorMessage] = useState<string | null>(null);
  const [isSignInInProgress, setIsSignInInProgress] = useState(false);

  /**
   * Whose `users/{userId}` document has already been touched this page load.
   *
   * Without it, StrictMode's deliberate double-mount in development would fire
   * the same read and write twice on every start-up, and a reconnect that
   * re-emits the current user would do it again.
   */
  const userIdWithEnsuredDocument = useRef<string | null>(null);

  useEffect(() => {
    /*
     * A redirect sign-in reports its failures here and nowhere else — most
     * importantly `auth/unauthorized-domain`. The success path needs nothing
     * from this, because the observer below picks the restored session up on its
     * own.
     */
    void collectRedirectSignInResult().catch((error: unknown) => {
      setAuthenticationErrorMessage(describeAuthenticationError(error));
    });

    return observeSignedInUser((nextSignedInUser) => {
      setSignedInUser(nextSignedInUser);
      setAuthenticationStatus(nextSignedInUser === null ? 'signedOut' : 'signedIn');
      setIsSignInInProgress(false);

      if (nextSignedInUser === null) {
        userIdWithEnsuredDocument.current = null;

        return;
      }

      if (userIdWithEnsuredDocument.current === nextSignedInUser.userId) {
        return;
      }

      userIdWithEnsuredDocument.current = nextSignedInUser.userId;

      void ensureUserDocumentExists(nextSignedInUser.userId).catch((error: unknown) => {
        /*
         * Sign-in itself worked, so the user is let through rather than bounced
         * back to a screen they have already dealt with. What failed is the
         * write, which in practice means the security rules are not deployed.
         * Clearing the ref lets the next sign-in try again.
         */
        userIdWithEnsuredDocument.current = null;
        setAuthenticationErrorMessage(describeAuthenticationError(error));
      });
    });
  }, []);

  const startGoogleSignIn = useCallback(async () => {
    setAuthenticationErrorMessage(null);
    setIsSignInInProgress(true);

    try {
      await signInWithGoogle();

      // Deliberately not clearing `isSignInInProgress` here. On success the
      // observer above does it, and on the redirect path this line is never
      // reached because the page has already left.
    } catch (error: unknown) {
      // Closing the popup is a decision, not a failure. Say nothing about it.
      if (!isUserCancelledSignIn(error)) {
        setAuthenticationErrorMessage(describeAuthenticationError(error));
      }

      setIsSignInInProgress(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthenticationErrorMessage(null);

    try {
      await signOutOfApplication();
    } catch (error: unknown) {
      setAuthenticationErrorMessage(describeAuthenticationError(error));
    }
  }, []);

  const contextValue = useMemo<AuthenticationContextValue>(
    () => ({
      authenticationStatus,
      signedInUser,
      authenticationErrorMessage,
      isSignInInProgress,
      startGoogleSignIn,
      signOut,
    }),
    [
      authenticationStatus,
      signedInUser,
      authenticationErrorMessage,
      isSignInInProgress,
      startGoogleSignIn,
      signOut,
    ],
  );

  return (
    <AuthenticationContext.Provider value={contextValue}>{children}</AuthenticationContext.Provider>
  );
}
