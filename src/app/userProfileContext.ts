import { createContext } from 'react';

import type { OnboardingDraft } from '@/domain/onboardingValidation';
import type { UserProfile } from '@/types/userAccountTypes';

/**
 * `loading` and `failed` are both real states.
 *
 * `failed` matters more than it looks: a profile read can fail on a bad
 * connection, and treating that as "no profile yet" would walk someone who
 * finished onboarding months ago straight back into it. Onboarding writes with
 * `merge`, so it would not destroy anything — but being asked your height again
 * because the wifi dropped is its own kind of broken.
 */
export type UserProfileStatus = 'loading' | 'needsOnboarding' | 'ready' | 'failed';

export type UserProfileContextValue = {
  userProfileStatus: UserProfileStatus;

  /** Non-null only when the status is `ready`. */
  userProfile: UserProfile | null;

  /** A sentence to show, when the status is `failed`. */
  profileErrorMessage: string | null;

  /** Writes the profile and the starting settings. The watcher does the rest. */
  completeOnboarding: (draft: OnboardingDraft) => Promise<void>;

  /**
   * Resubscribes after a failure.
   *
   * Not async: a failed snapshot listener is torn down by Firestore, so retrying
   * means starting a new one rather than awaiting another read.
   */
  retryLoadingUserProfile: () => void;
};

export const UserProfileContext = createContext<UserProfileContextValue | null>(null);
