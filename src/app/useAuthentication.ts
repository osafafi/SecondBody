import { useContext } from 'react';

import { AuthenticationContext, type AuthenticationContextValue } from './authenticationContext';

/**
 * Reads who is signed in, and the two actions that change it.
 *
 * Screens use this for the signed-in user's id when talking to a repository, and
 * for the sign-out control in Settings. Nothing else in the app should reach for
 * Firebase auth directly.
 */
export function useAuthentication(): AuthenticationContextValue {
  const contextValue = useContext(AuthenticationContext);

  if (!contextValue) {
    throw new Error('useAuthentication must be used inside an <AuthenticationProvider>.');
  }

  return contextValue;
}
