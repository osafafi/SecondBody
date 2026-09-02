import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { OnboardingDraft } from '@/domain/onboardingValidation';
import { describeAuthenticationError } from '@/services/auth/authenticationErrorMessages';
import {
  observeUserProfile,
  writeUserProfile,
} from '@/services/repositories/userProfileRepository';
import { writeCompleteUserSettings } from '@/services/repositories/userSettingsRepository';
import { DEFAULT_USER_SETTINGS, type UserProfile } from '@/types/userAccountTypes';

import { useAuthentication } from './useAuthentication';
import {
  UserProfileContext,
  type UserProfileContextValue,
  type UserProfileStatus,
} from './userProfileContext';

type UserProfileProviderProps = {
  children: ReactNode;
};

/**
 * What was loaded, and **whose it is**.
 *
 * The `userId` is the whole point of this shape. Without it, the moment one
 * account signs out and another signs in, there is a render where the new user's
 * id is in context but the previous user's profile is still in state — and the
 * app would show one person another person's height. Tagging the state with its
 * owner means anything belonging to somebody else simply does not count as
 * loaded.
 */
type LoadedProfileState = {
  userId: string;
  status: UserProfileStatus;
  profile: UserProfile | null;
  errorMessage: string | null;
};

/**
 * Holds the signed-in user's profile, and writes it when onboarding finishes.
 *
 * Mounted inside `AuthenticationProvider` and outside `OnboardingGate`, so it
 * can assume there is a signed-in user and the gate can read the result.
 *
 * The profile is **watched** rather than fetched. Firestore's local cache makes
 * the first callback effectively instant and then corrects it from the server,
 * a write from onboarding re-fires it with no explicit refetch, and setting
 * state from a subscription callback is the shape React wants an effect to have.
 */
export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const { signedInUser } = useAuthentication();
  const signedInUserId = signedInUser?.userId ?? null;

  const [loadedProfileState, setLoadedProfileState] = useState<LoadedProfileState | null>(null);

  /**
   * Bumped to resubscribe.
   *
   * Firestore tears a listener down when it errors, so recovering from a failed
   * read means starting a new one. Changing this re-runs the effect, which is
   * the only way to do that from outside it.
   */
  const [subscriptionAttempt, setSubscriptionAttempt] = useState(0);

  useEffect(() => {
    if (signedInUserId === null) {
      // Nothing to watch, and nothing to clear: state belonging to a different
      // user is filtered out below rather than reset here.
      return;
    }

    return observeUserProfile(
      signedInUserId,
      (profile) => {
        setLoadedProfileState({
          userId: signedInUserId,
          /*
           * A profile that exists but has `hasCompletedOnboarding: false`
           * counts as unfinished. That happens when onboarding was abandoned
           * halfway on another device, and the flag is what says so — not the
           * document merely existing.
           */
          status: profile?.hasCompletedOnboarding === true ? 'ready' : 'needsOnboarding',
          profile,
          errorMessage: null,
        });
      },
      (error: unknown) => {
        setLoadedProfileState({
          userId: signedInUserId,
          status: 'failed',
          profile: null,
          errorMessage: describeAuthenticationError(error),
        });
      },
    );
  }, [signedInUserId, subscriptionAttempt]);

  /*
   * Derived rather than stored. Anything loaded for a different user — or
   * loaded when nobody is signed in — reads as "still loading", which is
   * exactly what it is from the current user's point of view.
   */
  const stateForCurrentUser =
    signedInUserId !== null && loadedProfileState?.userId === signedInUserId
      ? loadedProfileState
      : null;

  const completeOnboarding = useCallback(
    async (draft: OnboardingDraft) => {
      if (signedInUserId === null) {
        throw new Error('Cannot complete onboarding while signed out.');
      }

      /*
       * The draft's numbers are nullable while it is being typed. Reaching here
       * means the validation in `src/domain/onboardingValidation.ts` passed, so
       * they are all answered — but that is a fact about the caller rather than
       * something the compiler knows, so it is checked rather than asserted
       * away with a non-null `!`.
       */
      const { birthYear, heightCentimetres, startingWeightKilograms, targetWeightKilograms } =
        draft;

      if (
        birthYear === null ||
        heightCentimetres === null ||
        startingWeightKilograms === null ||
        targetWeightKilograms === null
      ) {
        throw new Error('Onboarding tried to save before every question was answered.');
      }

      await writeUserProfile(signedInUserId, {
        displayName: draft.displayName.trim(),
        birthYear,
        heightCentimetres,
        startingWeightKilograms,
        targetWeightKilograms,
        painAreas: draft.painAreas,
        excludedExerciseIds: [],
        unavailableExerciseIds: [],
        availableEquipmentIds: draft.availableEquipmentIds,
        trainingDaysOfWeek: draft.trainingDaysOfWeek,
        hasCompletedOnboarding: true,
      });

      /*
       * Settings are written second and separately. If this fails the profile
       * still stands, and `readUserSettings` returns the defaults for a missing
       * document anyway — so the worst case is starting on the default palette
       * rather than a half-finished account that cannot get past the gate.
       */
      await writeCompleteUserSettings(signedInUserId, DEFAULT_USER_SETTINGS);

      // No reload: the watcher above fires on this write by itself.
    },
    [signedInUserId],
  );

  const retryLoadingUserProfile = useCallback(() => {
    setLoadedProfileState(null);
    setSubscriptionAttempt((attempt) => attempt + 1);
  }, []);

  const contextValue = useMemo<UserProfileContextValue>(
    () => ({
      userProfileStatus: stateForCurrentUser?.status ?? 'loading',
      userProfile: stateForCurrentUser?.profile ?? null,
      profileErrorMessage: stateForCurrentUser?.errorMessage ?? null,
      completeOnboarding,
      retryLoadingUserProfile,
    }),
    [stateForCurrentUser, completeOnboarding, retryLoadingUserProfile],
  );

  return <UserProfileContext.Provider value={contextValue}>{children}</UserProfileContext.Provider>;
}
