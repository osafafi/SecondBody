import { useCallback, useEffect, useState } from 'react';

import { describeRepositoryError } from '@/services/repositories/repositoryErrorMessages';
import {
  readUserSettings,
  writeUserSettings,
} from '@/services/repositories/userSettingsRepository';
import type { UserSettings } from '@/types/userAccountTypes';

/**
 * The preferences document, read once and written a field at a time.
 *
 * M4 built `settings/current` and the repository around it, and then nothing
 * edited it: the session player and the two dashboards read the document, but
 * every value in it was whatever `DEFAULT_USER_SETTINGS` said. This is the
 * screen that makes it mean something.
 *
 * Writes are merged one field at a time rather than sending the whole document,
 * so two preferences changed in quick succession cannot undo each other — see
 * `writeUserSettings`.
 */

export type EditableUserSettingsStatus = 'loading' | 'ready' | 'failed';

export type EditableUserSettingsState = {
  settingsStatus: EditableUserSettingsStatus;

  /** Non-null only when the status is `ready`. */
  userSettings: UserSettings | null;

  settingsErrorMessage: string | null;

  isSavingSettings: boolean;

  /** Set when a write failed. The optimistic change is rolled back with it. */
  saveErrorMessage: string | null;

  reloadUserSettings: () => void;

  changeUserSettings: (changes: Partial<Omit<UserSettings, 'updatedAt'>>) => void;
};

/** The same owner-tagged shape as the other hooks in this app, for the same reason. */
type CompletedRead = {
  forUserId: string;
  forReloadCounter: number;

  status: 'ready' | 'failed';
  userSettings: UserSettings | null;
  errorMessage: string | null;
};

/** Pass null while the signed-in user is not known yet; nothing is read. */
export function useEditableUserSettings(userId: string | null): EditableUserSettingsState {
  const [completedRead, setCompletedRead] = useState<CompletedRead | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const reloadUserSettings = useCallback(() => {
    setSaveErrorMessage(null);
    setReloadCounter((previousCounter) => previousCounter + 1);
  }, []);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let isCurrentRequest = true;

    const loadUserSettings = async () => {
      try {
        const userSettings = await readUserSettings(userId);

        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'ready',
          userSettings,
          errorMessage: null,
        });
      } catch (error: unknown) {
        if (!isCurrentRequest) {
          return;
        }

        setCompletedRead({
          forUserId: userId,
          forReloadCounter: reloadCounter,
          status: 'failed',
          userSettings: null,
          errorMessage: describeRepositoryError(error),
        });
      }
    };

    void loadUserSettings();

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, reloadCounter]);

  const isCompletedReadCurrent =
    completedRead !== null &&
    completedRead.forUserId === userId &&
    completedRead.forReloadCounter === reloadCounter;

  /**
   * Changes one or more preferences, on screen first.
   *
   * Optimistic, because these are switches and a switch that waits for a round
   * trip before it moves gets flicked twice. A failed write puts the old value
   * back rather than leaving a switch showing a setting nothing recorded.
   */
  const changeUserSettings = useCallback(
    (changes: Partial<Omit<UserSettings, 'updatedAt'>>) => {
      if (
        userId === null ||
        !isCompletedReadCurrent ||
        completedRead.status !== 'ready' ||
        completedRead.userSettings === null
      ) {
        return;
      }

      const previousRead = completedRead;

      setSaveErrorMessage(null);
      setIsSavingSettings(true);
      setCompletedRead({
        ...previousRead,
        /*
         * `Object.assign` rather than a spread. `exactOptionalPropertyTypes` is
         * on, and spreading a `Partial` into a complete object makes every field
         * optional again — which is not what a merge of "these two fields" onto
         * "all of them" actually produces.
         */
        userSettings: Object.assign({}, previousRead.userSettings, changes),
      });

      void writeUserSettings(userId, changes)
        .catch((error: unknown) => {
          setSaveErrorMessage(describeRepositoryError(error));
          setCompletedRead(previousRead);
        })
        .finally(() => {
          setIsSavingSettings(false);
        });
    },
    [userId, completedRead, isCompletedReadCurrent],
  );

  if (!isCompletedReadCurrent) {
    return {
      settingsStatus: 'loading',
      userSettings: null,
      settingsErrorMessage: null,
      isSavingSettings,
      saveErrorMessage,
      reloadUserSettings,
      changeUserSettings,
    };
  }

  return {
    settingsStatus: completedRead.status,
    userSettings: completedRead.userSettings,
    settingsErrorMessage: completedRead.errorMessage,
    isSavingSettings,
    saveErrorMessage,
    reloadUserSettings,
    changeUserSettings,
  };
}
