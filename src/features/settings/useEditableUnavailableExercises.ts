import { useCallback, useState } from 'react';

import { useAuthentication } from '@/app/useAuthentication';
import { useUserProfile } from '@/app/useUserProfile';
import { removeUnavailableExerciseId } from '@/domain/exerciseAvailability';
import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import { writeUnavailableExerciseIds } from '@/services/repositories/userProfileRepository';

/**
 * Taking a movement off the "my gym has not got this" list.
 *
 * Its own hook rather than part of `useEditableProfile`, because this is a
 * different shape of edit: one row, one action, written straight away, with no
 * form to fill in and nothing to submit. Folding it into the profile form would
 * have meant a save button that has to be pressed before a machine the gym
 * bought last week counts as bought.
 *
 * Like the profile form it does not read anything back. `UserProfileProvider`
 * watches the document for the life of the app, so the list re-renders on its
 * own once the write lands.
 */

export type EditableUnavailableExercisesState = {
  /** Straight off the watched profile. Empty until something is flagged. */
  unavailableExerciseIds: string[];

  isSaving: boolean;

  saveErrorMessage: string | null;

  restoreExercise: (exerciseId: string) => void;
};

export function useEditableUnavailableExercises(): EditableUnavailableExercisesState {
  const { signedInUser } = useAuthentication();
  const { userProfile } = useUserProfile();

  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const restoreExercise = useCallback(
    (exerciseId: string) => {
      const signedInUserId = signedInUser?.userId ?? null;

      if (signedInUserId === null || userProfile === null) {
        return;
      }

      setIsSaving(true);
      setSaveErrorMessage(null);

      void writeUnavailableExerciseIds(
        signedInUserId,
        removeUnavailableExerciseId(userProfile.unavailableExerciseIds, exerciseId),
      )
        .catch((error: unknown) => {
          setSaveErrorMessage(describeRepositoryError(error));
        })
        .finally(() => {
          setIsSaving(false);
        });
    },
    [signedInUser, userProfile],
  );

  return {
    unavailableExerciseIds: userProfile?.unavailableExerciseIds ?? [],
    isSaving,
    saveErrorMessage,
    restoreExercise,
  };
}
