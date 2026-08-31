/**
 * Who is signed in.
 *
 * Deliberately not Firebase's `User`. That type carries tokens, provider
 * metadata and a couple of dozen methods, none of which a screen has any
 * business reaching for. Everything above `services/` sees this shape instead.
 */
export type SignedInUser = {
  /** The Firebase auth uid. Also the `users/{userId}` document id. */
  userId: string;

  /** Null when the Google account has no name on it, which is rare but legal. */
  displayName: string | null;

  emailAddress: string | null;

  /** Google's avatar URL, or null when the account has no photo. */
  photoUrl: string | null;
};

/**
 * There are three states here, not two.
 *
 * `checking` exists because Firebase restores a persisted session
 * asynchronously: for a moment after load, nobody knows yet whether there is a
 * user. Collapsing that moment into `signedOut` would flash the sign-in screen
 * at someone who is already signed in, on every single refresh.
 */
export type AuthenticationStatus = 'checking' | 'signedIn' | 'signedOut';
