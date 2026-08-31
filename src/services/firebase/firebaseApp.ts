import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  type Firestore,
} from 'firebase/firestore';

import { firebaseConfiguration } from './firebaseConfiguration';

/**
 * The one Firebase app, and the two services built on top of it.
 *
 * Nothing outside `src/services/` imports this file. Screens talk to
 * repositories and repositories talk to Firestore — see CLAUDE.md section 3.
 *
 * `getApps()` is consulted first because Vite's hot module replacement
 * re-executes this module during development, and both `initializeApp` and
 * `initializeFirestore` throw when they run a second time for the same project.
 */
const existingFirebaseApp = getApps()[0];

export const firebaseApp: FirebaseApp = existingFirebaseApp ?? initializeApp(firebaseConfiguration);

/**
 * Google is the only sign-in provider. `getAuth` persists the session in
 * IndexedDB by default, which is what makes signing out and back in return to
 * the same data instead of starting over.
 */
export const firebaseAuthentication: Auth = getAuth(firebaseApp);

/**
 * Firestore, with its local cache turned on.
 *
 * One configuration line, and it makes a brief signal drop in the gym invisible:
 * reads are served from the cache and writes queue locally until the connection
 * returns. This is deliberately *not* full offline support — docs/DATA_MODEL.md
 * section 7 records what was left out and why.
 */
export const firestoreDatabase: Firestore = existingFirebaseApp
  ? getFirestore(existingFirebaseApp)
  : initializeFirestore(firebaseApp, { localCache: persistentLocalCache() });
