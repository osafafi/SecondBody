/**
 * The Firebase project this application talks to.
 *
 * **These values are committed to a public repository on purpose.** They are
 * identifiers, not credentials, and they grant no access on their own — see
 * docs/DATA_MODEL.md section 5 for the full explanation.
 *
 * The two things that actually protect the data are the rules in
 * `firestore.rules` and the authorised-domain list in Firebase Auth. Neither is
 * weakened by anything in this object being public.
 */
export const firebaseConfiguration = {
  apiKey: 'AIzaSyCLT8PhuCqxS87GlVCWv_ofddKDb4nJ2TY',
  authDomain: 'second-body-osi.firebaseapp.com',
  projectId: 'second-body-osi',
  storageBucket: 'second-body-osi.firebasestorage.app',
  messagingSenderId: '917535912250',
  appId: '1:917535912250:web:1efa44e4fe481437b3a003',
} as const;
