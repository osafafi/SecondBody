import { useContext } from 'react';

import { UserProfileContext, type UserProfileContextValue } from './userProfileContext';

/**
 * Reads the signed-in user's profile.
 *
 * Screens behind `OnboardingGate` can rely on `userProfile` being non-null —
 * the gate does not render them otherwise — but the type stays nullable because
 * the provider is mounted above the gate and the onboarding flow itself uses
 * this hook while there is no profile yet.
 */
export function useUserProfile(): UserProfileContextValue {
  const contextValue = useContext(UserProfileContext);

  if (!contextValue) {
    throw new Error('useUserProfile must be used inside a <UserProfileProvider>.');
  }

  return contextValue;
}
