import { createContext } from 'react';

import type { AuthenticationStatus, SignedInUser } from '@/types/authenticationTypes';

export type AuthenticationContextValue = {
  /** `checking` until Firebase has restored (or failed to restore) the session. */
  authenticationStatus: AuthenticationStatus;

  /** Null whenever the status is anything other than `signedIn`. */
  signedInUser: SignedInUser | null;

  /** A sentence to show the user, or null when nothing has gone wrong. */
  authenticationErrorMessage: string | null;

  /** True while a sign-in attempt is in flight, so the button can disable itself. */
  isSignInInProgress: boolean;

  startGoogleSignIn: () => Promise<void>;

  signOut: () => Promise<void>;
};

/**
 * Kept in its own file so `AuthenticationProvider.tsx` exports a component and
 * nothing else, and `useAuthentication.ts` exports a hook and nothing else.
 * React Fast Refresh only works reliably when a module's exports are all of one
 * kind — the same reason `colorPaletteContext.ts` is split out.
 */
export const AuthenticationContext = createContext<AuthenticationContextValue | null>(null);
