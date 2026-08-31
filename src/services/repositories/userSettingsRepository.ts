import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { DEFAULT_USER_SETTINGS, type UserSettings } from '@/types/userAccountTypes';

import {
  fromUserSettingsDocument,
  toUserSettingsDocumentFields,
} from './userAccountDocumentMapping';
import {
  SINGLETON_DOCUMENT_ID,
  USER_SUBCOLLECTION_NAMES,
  buildUserSubdocumentReference,
} from './userCollectionPaths';

/** `users/{userId}/settings/current` — how the user wants the app to behave. */

function buildSettingsReference(userId: string) {
  return buildUserSubdocumentReference(
    userId,
    USER_SUBCOLLECTION_NAMES.settings,
    SINGLETON_DOCUMENT_ID,
  );
}

/**
 * Always returns settings.
 *
 * Unlike the profile, a missing settings document is not a fork in the app's
 * behaviour — it just means nothing has been changed from the defaults yet. A
 * caller that had to handle null here would write the same fallback every time.
 */
export async function readUserSettings(userId: string): Promise<UserSettings> {
  const settingsDocument = await getDoc(buildSettingsReference(userId));

  if (!settingsDocument.exists()) {
    return { ...DEFAULT_USER_SETTINGS, updatedAt: new Date() };
  }

  return fromUserSettingsDocument(settingsDocument.data());
}

/**
 * Writes one or more preferences, leaving the rest alone.
 *
 * Merged rather than replaced so that two screens changing different settings
 * cannot undo each other — the palette picker writes one field and should not
 * have to know what the rest of the document currently holds.
 */
export async function writeUserSettings(
  userId: string,
  settingsChanges: Partial<Omit<UserSettings, 'updatedAt'>>,
): Promise<void> {
  /*
   * Spread directly rather than routed through `toUserSettingsDocumentFields`.
   * Every preference is a primitive whose stored name matches its type name, so
   * that function is identity-shaped here, and rebuilding a whole document from
   * a partial would write the defaults over preferences the caller never
   * mentioned.
   */
  await setDoc(
    buildSettingsReference(userId),
    { ...settingsChanges, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Writes every preference at once, for the first save of a new account. */
export async function writeCompleteUserSettings(
  userId: string,
  settings: Omit<UserSettings, 'updatedAt'>,
): Promise<void> {
  await setDoc(buildSettingsReference(userId), {
    ...toUserSettingsDocumentFields(settings),
    updatedAt: serverTimestamp(),
  });
}
