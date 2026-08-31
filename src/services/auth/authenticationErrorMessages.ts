/**
 * Turning Firebase error codes into sentences a person can act on.
 *
 * These are not Harout speaking — the coach does not say
 * "auth/unauthorized-domain", and coach copy belongs in
 * `src/content/coachVoice/`. These are plain, factual interface strings for the
 * handful of failures that are actually reachable, and they mirror the
 * troubleshooting table in docs/SETUP_FIREBASE.md.
 *
 * No Firebase import, so it stays unit testable on its own.
 */

const FALLBACK_MESSAGE = 'Sign-in did not go through. Check your connection and try again.';

const MESSAGE_BY_ERROR_CODE: Readonly<Record<string, string>> = {
  'auth/unauthorized-domain':
    'This address is not on the approved list for sign-in. Open the app from localhost or the published site.',
  'auth/operation-not-allowed':
    'Google sign-in is switched off for this project. It has to be enabled in the Firebase console first.',
  'auth/network-request-failed': 'Could not reach Google. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/too-many-requests': 'Too many attempts just now. Wait a moment and try again.',
  'permission-denied':
    'Signed in, but the database refused the write. The security rules may not be deployed yet.',
};

/** Reads a Firebase error code off anything that might have one. */
export function readErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const errorCode: unknown = (error as { code: unknown }).code;

  return typeof errorCode === 'string' ? errorCode : null;
}

/**
 * A sentence for the user, for any thrown value.
 *
 * Always returns something. A failure with no message is the one outcome that
 * leaves someone staring at a screen with no idea what happened.
 */
export function describeAuthenticationError(error: unknown): string {
  const errorCode = readErrorCode(error);

  if (errorCode === null) {
    return FALLBACK_MESSAGE;
  }

  return MESSAGE_BY_ERROR_CODE[errorCode] ?? FALLBACK_MESSAGE;
}

/**
 * True when the failure was the user backing out, which is not worth reporting
 * as an error at all.
 */
export function isUserCancelledSignIn(error: unknown): boolean {
  const errorCode = readErrorCode(error);

  return errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request';
}
