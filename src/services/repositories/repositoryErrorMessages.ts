import { readErrorCode } from '@/services/auth/authenticationErrorMessages';

/**
 * Turning a Firestore failure into a sentence about data.
 *
 * `describeAuthenticationError` covers signing in and its fallback says so —
 * "sign-in did not go through" is the wrong thing to read after a set fails to
 * save. Same idea, same error codes, different subject.
 *
 * Reads a code off the error rather than importing Firebase, so it stays unit
 * testable on its own.
 */

const FALLBACK_MESSAGE =
  'Could not save that just now. It will go up on its own once you are back on a connection.';

const MESSAGE_BY_ERROR_CODE: Readonly<Record<string, string>> = {
  'permission-denied':
    'The database refused that write. The security rules may not be deployed yet.',
  unauthenticated: 'You have been signed out. Sign in again to keep logging this session.',
  unavailable:
    'No connection to the database. Everything you log is kept on the phone and goes up when you are back.',
  'failed-precondition':
    'The database would not accept that. It usually means a query needs an index that has not been deployed.',
  'resource-exhausted': 'The database is over its quota for today.',
};

/**
 * A sentence for the user, for any thrown value.
 *
 * The fallback is deliberately reassuring rather than alarming: Firestore's
 * local cache means the overwhelming majority of failures here are a dead spot
 * in a gym, and the write does eventually land.
 */
export function describeRepositoryError(error: unknown): string {
  const errorCode = readErrorCode(error);

  if (errorCode === null) {
    return FALLBACK_MESSAGE;
  }

  return MESSAGE_BY_ERROR_CODE[errorCode] ?? FALLBACK_MESSAGE;
}
