/**
 * The decisions `exportCoachingBundle.mjs` makes before it touches anything.
 *
 * Split out because they are the parts worth testing: which account is being
 * exported, which project is being read, and where the file goes. The script
 * itself is a Firestore read and a `writeFile`, which is nothing to get wrong
 * and nothing worth a fake Firebase to prove.
 */

/**
 * Where exported bundles go.
 *
 * Gitignored, and that is not a detail. A bundle is body weight, every session
 * and everything written in the journal — precisely the personal data CLAUDE.md
 * rule 2 exists to keep out of a public repository.
 */
export const COACHING_OUTPUT_DIRECTORY = '.coaching';

/**
 * Reads `--user-id` and `--email` off a command line.
 *
 * Both are optional. With neither, the script looks the account up in Firebase
 * Auth, which works because this is a single-user application — see
 * `describeAmbiguousAccounts`.
 */
export function parseCoachingExportArguments(commandLineArguments) {
  const options = { userId: null, email: null };

  for (let index = 0; index < commandLineArguments.length; index += 1) {
    const argument = commandLineArguments[index];

    if (argument === '--user-id' || argument === '--email') {
      const value = commandLineArguments[index + 1];

      if (value === undefined || value.startsWith('--')) {
        throw new Error(`${argument} needs a value after it.`);
      }

      options[argument === '--user-id' ? 'userId' : 'email'] = value;
      index += 1;

      continue;
    }

    throw new Error(
      `Unrecognised argument "${argument}". Usage: npm run coach:export [-- --user-id <uid> | --email <address>]`,
    );
  }

  if (options.userId !== null && options.email !== null) {
    throw new Error('Pass --user-id or --email, not both.');
  }

  return options;
}

/**
 * The project id out of a parsed `.firebaserc`.
 *
 * Read from the file rather than hard-coded, so that the script and
 * `firebase deploy` can never be pointed at different projects — which is the
 * failure that took three attempts to diagnose in M9.
 */
export function readProjectIdFromFirebaseRc(firebaseRc) {
  const projectId = firebaseRc?.projects?.default;

  if (typeof projectId !== 'string' || projectId.length === 0) {
    throw new Error(
      '.firebaserc has no default project. Expected projects.default to be a string.',
    );
  }

  return projectId;
}

/**
 * What to say when the account cannot be worked out on its own.
 *
 * A sentence rather than a stack trace, because the fix is a flag and the
 * person running this is not debugging the script.
 */
export function describeAmbiguousAccounts(accountCount) {
  if (accountCount === 0) {
    return 'No accounts exist in this Firebase project yet. Sign in to the app once, then run this again.';
  }

  return (
    `This project has ${String(accountCount)} accounts, so the script cannot guess which one to ` +
    'export. Run it again with --user-id <uid> or --email <address>.'
  );
}
