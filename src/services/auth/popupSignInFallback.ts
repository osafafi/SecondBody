/**
 * Telling "the browser would not open a popup" apart from "the user changed
 * their mind".
 *
 * The distinction decides whether sign-in falls back to a full-page redirect. A
 * blocked popup should fall back — otherwise sign-in is simply impossible in
 * that browser. A popup the user deliberately closed should not: redirecting
 * someone away from the app immediately after they cancelled is the app arguing
 * with them.
 *
 * Kept in its own module, free of any Firebase import, so it can be unit tested
 * without initialising an app and a Firestore cache first.
 */

/** Popup failures where a redirect is the right next move. */
export const POPUP_UNAVAILABLE_ERROR_CODES: readonly string[] = [
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
];

/**
 * True when the popup never opened and a redirect is worth trying.
 *
 * Firebase throws `FirebaseError`, but anything can end up in a `catch`, so this
 * narrows from `unknown` rather than trusting the shape.
 */
export function isPopupUnavailableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const errorCode: unknown = (error as { code: unknown }).code;

  return typeof errorCode === 'string' && POPUP_UNAVAILABLE_ERROR_CODES.includes(errorCode);
}
