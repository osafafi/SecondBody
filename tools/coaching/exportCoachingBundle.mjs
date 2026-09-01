#!/usr/bin/env node
/**
 * Writes a coaching bundle to `.coaching/`, from a laptop.
 *
 * ```bash
 * gcloud auth application-default login   # once
 * npm run coach:export
 * ```
 *
 * This is half of M10's retrieval story. The other half is the download button
 * in Settings, and **the two produce the same file**: everything after the read
 * happens in `src/domain/coachingBundleAssembly.ts`, which this script loads
 * rather than reimplements.
 *
 * Three things about how it does that are worth knowing before changing it.
 *
 * **No service account key.** The one credential this project has is a GitHub
 * Actions secret scoped to publishing security rules, and it cannot read the
 * database — see docs/DATA_MODEL.md section 5. This script authenticates as
 * *you*, through Application Default Credentials, so there is no key file on
 * the disk to leak and nothing new to revoke. `gcloud auth application-default
 * login` once and it keeps working.
 *
 * **It reads Firestore with `firebase-admin`, not the web SDK.** A Node process
 * has no browser to sign in with. The queries below are therefore written out
 * again rather than reusing `src/services/repositories/`, and each one mirrors
 * the repository it copies — same field, same direction, same limit. What is
 * *not* rewritten is the translation from documents to types: the mapping
 * modules import no Firebase at all, on purpose, so this script uses the very
 * same functions the app does. That is what stops the two exports disagreeing
 * about what a stored document means.
 *
 * **It loads TypeScript through Vite.** `ssrLoadModule` resolves the `@/` alias
 * and strips the types, so a `.mjs` script can import `src/domain/`. The
 * alternative was a second copy of the bundle shape written in JavaScript,
 * which is the thing this whole design exists to avoid. It costs about a second
 * of start-up and no new dependency — Vite is already here.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createServer } from 'vite';

import {
  COACHING_OUTPUT_DIRECTORY,
  describeAmbiguousAccounts,
  parseCoachingExportArguments,
  readProjectIdFromFirebaseRc,
} from './coachingExportOptions.mjs';

/** The repository root, two levels up from `tools/coaching/`. */
const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * The `src/` modules this script borrows, all of them free of any Firebase
 * import. Loaded through Vite so the app and this script share one definition
 * of every one of them.
 */
const MODULE_PATHS = {
  coachingBundle: '/src/domain/coachingBundle.ts',
  coachingBundleAssembly: '/src/domain/coachingBundleAssembly.ts',
  trainingHistoryMapping: '/src/services/repositories/trainingHistoryDocumentMapping.ts',
  dailyTrackingMapping: '/src/services/repositories/dailyTrackingDocumentMapping.ts',
  journalMapping: '/src/services/repositories/journalDocumentMapping.ts',
  userAccountMapping: '/src/services/repositories/userAccountDocumentMapping.ts',
  coachingContentFacts: '/src/content/coaching/coachingContentFacts.ts',
};

/** Loads every borrowed module in one Vite server, then shuts it down. */
async function loadSharedModules() {
  const viteServer = await createServer({
    root: REPOSITORY_ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'warn',
  });

  try {
    const loadedEntries = await Promise.all(
      Object.entries(MODULE_PATHS).map(async ([name, modulePath]) => [
        name,
        await viteServer.ssrLoadModule(modulePath),
      ]),
    );

    return Object.fromEntries(loadedEntries);
  } finally {
    await viteServer.close();
  }
}

/**
 * Which account to export.
 *
 * A flag wins. With no flag the accounts are listed, because this is a
 * single-user application and typing a uid to export the only account there has
 * ever been would be ceremony.
 */
async function resolveUserId(auth, options) {
  if (options.userId !== null) {
    return options.userId;
  }

  if (options.email !== null) {
    const userRecord = await auth.getUserByEmail(options.email);

    return userRecord.uid;
  }

  // Two, so "exactly one" can be told from "more than one" in a single call.
  const listedUsers = await auth.listUsers(2);

  if (listedUsers.users.length !== 1) {
    throw new Error(describeAmbiguousAccounts(listedUsers.users.length));
  }

  return listedUsers.users[0].uid;
}

/**
 * Every collection the bundle needs, read in parallel.
 *
 * Each query mirrors the repository in `src/services/repositories/` that reads
 * the same collection in the app. If one of those changes its ordering or its
 * field, the matching line here has to change with it — that duplication is the
 * price of a Node process not being able to use the web SDK, and it is why the
 * limits themselves come from `COACHING_EXPORT_LIMITS` rather than being typed
 * out twice.
 */
async function readStoredCoachingData({ firestore, userId, modules, limits }) {
  const { trainingHistoryMapping, dailyTrackingMapping, journalMapping, userAccountMapping } =
    modules;

  const userDocument = firestore.collection('users').doc(userId);

  const readCollection = async (name, applyQuery) => {
    const snapshot = await applyQuery(userDocument.collection(name));

    return snapshot.docs;
  };

  const [
    profileSnapshot,
    assignmentDocuments,
    sessionDocuments,
    bodyMetricDocuments,
    habitDocuments,
    personalRecordDocuments,
    journalDocuments,
  ] = await Promise.all([
    userDocument.collection('profile').doc('current').get(),

    // `readActiveProgramAssignment`: a where and nothing else.
    readCollection('programAssignments', (collection) =>
      collection.where('status', '==', 'active').limit(1).get(),
    ),

    // `readRecentWorkoutSessions`: newest first by when they started.
    readCollection('workoutSessions', (collection) =>
      collection.orderBy('startedAt', 'desc').limit(limits.sessionCount).get(),
    ),

    // `readRecentBodyMetricEntries`: by the day weighed, not the day typed in.
    readCollection('bodyMetrics', (collection) =>
      collection.orderBy('recordedOn', 'desc').limit(limits.bodyMetricEntryCount).get(),
    ),

    // `readRecentDailyHabitRecords`: newest first.
    readCollection('dailyHabits', (collection) =>
      collection.orderBy('onDate', 'desc').limit(limits.habitDayCount).get(),
    ),

    // `readAllPersonalRecords`: one document per exercise ever trained.
    readCollection('personalRecords', (collection) => collection.get()),

    // `readRecentJournalEntries`: by when it was written, newest first.
    readCollection('journalEntries', (collection) =>
      collection.orderBy('writtenAt', 'desc').limit(limits.journalEntryCount).get(),
    ),
  ]);

  if (!profileSnapshot.exists) {
    throw new Error(
      `No profile at users/${userId}/profile/current. Either the wrong account was named, or onboarding was never finished.`,
    );
  }

  const activeAssignment = assignmentDocuments[0];

  return {
    profile: userAccountMapping.fromUserProfileDocument(profileSnapshot.data()),

    assignment:
      activeAssignment === undefined
        ? null
        : trainingHistoryMapping.fromProgramAssignmentDocument(
            activeAssignment.id,
            activeAssignment.data(),
          ),

    sessions: sessionDocuments.map((document) => ({
      ...trainingHistoryMapping.fromWorkoutSessionDocument(document.id, document.data()),
      documentId: document.id,
    })),

    bodyMetricEntries: bodyMetricDocuments.map((document) =>
      dailyTrackingMapping.fromBodyMetricDocument(document.id, document.data()),
    ),

    habitRecords: habitDocuments.map((document) =>
      dailyTrackingMapping.fromDailyHabitDocument(document.id, document.data()),
    ),

    personalRecords: personalRecordDocuments.map((document) =>
      trainingHistoryMapping.fromPersonalRecordDocument(document.id, document.data()),
    ),

    journalEntries: journalDocuments.map((document) => ({
      ...journalMapping.fromJournalEntryDocument(document.id, document.data()),
      documentId: document.id,
    })),
  };
}

/** A count of what went in, so the run says what it actually found. */
function describeBundleContents(storedData) {
  return [
    `${String(storedData.sessions.length)} sessions`,
    `${String(storedData.bodyMetricEntries.length)} weigh-ins`,
    `${String(storedData.habitRecords.length)} habit days`,
    `${String(storedData.personalRecords.length)} records`,
    `${String(storedData.journalEntries.length)} journal entries`,
  ].join(', ');
}

async function main() {
  const options = parseCoachingExportArguments(process.argv.slice(2));

  const firebaseRc = JSON.parse(await readFile(path.join(REPOSITORY_ROOT, '.firebaserc'), 'utf8'));
  const projectId = readProjectIdFromFirebaseRc(firebaseRc);

  /*
   * Printed before anything is read, for the same reason the rules deploy in
   * CI prints the identity it is using: "wrong project" should be visible in
   * the output rather than inferred from a bundle that looks empty.
   */
  console.log(`Reading project ${projectId} as your gcloud application-default credentials.`);

  initializeApp({ credential: applicationDefault(), projectId });

  const firestore = getFirestore();
  const modules = await loadSharedModules();

  const { COACHING_EXPORT_LIMITS, COACHING_BUNDLE_FIRST_DAY_OF_WEEK, assembleCoachingBundle } =
    modules.coachingBundleAssembly;

  const userId = await resolveUserId(getAuth(), options);

  const storedData = await readStoredCoachingData({
    firestore,
    userId,
    modules,
    limits: COACHING_EXPORT_LIMITS,
  });

  const contentFacts = modules.coachingContentFacts.findCoachingContentFacts(
    storedData.assignment?.programTemplateId ?? null,
  );

  if (contentFacts === null) {
    throw new Error(
      `The stored programme "${storedData.assignment?.programTemplateId ?? ''}" is not in this checkout. ` +
        'The data and the content have gone out of step — pull, then run this again.',
    );
  }

  const generatedAt = new Date();

  const bundle = assembleCoachingBundle({
    generatedAt,
    storedData,
    contentFacts,
    firstDayOfWeek: COACHING_BUNDLE_FIRST_DAY_OF_WEEK,
    maximumHabitDayCount: COACHING_EXPORT_LIMITS.habitDayCount,
  });

  const outputDirectory = path.join(REPOSITORY_ROOT, COACHING_OUTPUT_DIRECTORY);
  const outputPath = path.join(
    outputDirectory,
    modules.coachingBundle.buildCoachingBundleFileName(generatedAt),
  );

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, modules.coachingBundle.formatCoachingBundleAsJson(bundle), 'utf8');

  console.log(`${describeBundleContents(storedData)}.`);
  console.log(`Written to ${path.relative(REPOSITORY_ROOT, outputPath)}.`);
}

// Only run when invoked directly, so the helpers stay importable by a test.
// `pathToFileURL` rather than a string comparison, for the reason spelled out
// at the bottom of `verifyExerciseMedia.mjs`.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
