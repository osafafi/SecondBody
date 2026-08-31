import { useCallback, useState } from 'react';

import { useAuthentication } from '@/app/useAuthentication';
import { useUserProfile } from '@/app/useUserProfile';
import { applyProfileEdits, type EditableProfileFields } from '@/domain/profileEditing';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import { writeUserProfile } from '@/services/repositories/userProfileRepository';
import type { UserProfile } from '@/types/userAccountTypes';

/**
 * Saving a change to the profile onboarding wrote.
 *
 * There is no read here. `UserProfileProvider` already watches
 * `profile/current` for the life of the app, so this hook writes and then does
 * nothing: the subscription fires on its own and the form is handed the new
 * values back through context. A second read would be a second opinion about
 * who the user is.
 *
 * What gets written is decided by `applyProfileEdits` in `src/domain/`, which
 * is where the rule about the four fields that may not be edited lives.
 */

export type EditableProfileState = {
  /** Null until onboarding has been completed, which cannot happen on this screen. */
  userProfile: UserProfile | null;

  isSavingProfile: boolean;

  saveErrorMessage: string | null;

  /** True after a save landed, until the next edit. Drives the "Saved" note. */
  hasJustSavedProfile: boolean;

  saveProfileEdits: (edits: EditableProfileFields) => void;

  /** Clears the saved note, for when the form is touched again. */
  forgetSaveResult: () => void;
};

export function useEditableProfile(): EditableProfileState {
  const { signedInUser } = useAuthentication();
  const { userProfile } = useUserProfile();

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [hasJustSavedProfile, setHasJustSavedProfile] = useState(false);

  const forgetSaveResult = useCallback(() => {
    setHasJustSavedProfile(false);
    setSaveErrorMessage(null);
  }, []);

  const saveProfileEdits = useCallback(
    (edits: EditableProfileFields) => {
      const signedInUserId = signedInUser?.userId ?? null;

      if (signedInUserId === null || userProfile === null) {
        return;
      }

      setIsSavingProfile(true);
      setSaveErrorMessage(null);
      setHasJustSavedProfile(false);

      void writeUserProfile(signedInUserId, applyProfileEdits(userProfile, edits))
        .then(() => {
          setHasJustSavedProfile(true);
        })
        .catch((error: unknown) => {
          setSaveErrorMessage(describeRepositoryError(error));
        })
        .finally(() => {
          setIsSavingProfile(false);
        });
    },
    [signedInUser, userProfile],
  );

  return {
    userProfile,
    isSavingProfile,
    saveErrorMessage,
    hasJustSavedProfile,
    saveProfileEdits,
    forgetSaveResult,
  };
}
