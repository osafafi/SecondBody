# Data Model

Everything Firestore stores, and the rules that protect it.

---

## 1. Principle

**The repository is public. No personal data goes in it.**

Static training _content_ — exercises, programmes, coach lines — lives in git because it
should be reviewed in pull requests. Everything about Omar's actual body and training lives
in Firestore behind auth.

## 2. Collection layout

Everything hangs off a single user document, so one security rule protects the lot.

```
users/{userId}
  |
  +-- (document fields: createdAt, lastActiveAt)
  |
  +-- profile/current                    one document
  +-- settings/current                   one document
  +-- programAssignments/{assignmentId}
  +-- workoutSessions/{sessionId}
  +-- bodyMetrics/{metricId}
  +-- dailyHabits/{yyyy-mm-dd}
  +-- personalRecords/{exerciseId}
  +-- journalEntries/{entryId}
```

`dailyHabits` is keyed by ISO date (`2026-09-01`) rather than a random id, so a day can be
read or written directly without a query. `personalRecords` is keyed by exercise id for the
same reason.

## 3. Document shapes

Types live in `src/types/` — `userAccountTypes.ts`, `trainingHistoryTypes.ts`,
`dailyTrackingTypes.ts` and `journalTypes.ts`. These are the shapes, in TypeScript, with the fields named the way
they are actually named.

**Two things below differ from what the application types actually say, and both are
deliberate.**

`Timestamp` is what Firestore stores. The application types use `Date`, because
`src/domain/` reads these types and must not know Firebase exists — see CLAUDE.md section 3.
Converting between the two is the repositories' job, in
`src/services/repositories/*DocumentMapping.ts`, and is exactly the translation logic
CLAUDE.md section 5 asks to have tested with fakes. A calendar day (`recordedOn`,
`startedOn`, `achievedOn`) is an ISO `YYYY-MM-DD` string in both, because a day is not an
instant and storing it as one would move it across midnight depending on who is reading.

Weights on a performed set are `number | null`, not `number`. A dead bug and a treadmill
walk have no weight, `PerformedSetRecord` in `performanceTypes.ts` has said so since M2, and
storing `0` would be a lie that the volume charts then average in.

### `profile/current`

```ts
type UserProfile = {
  displayName: string;
  birthYear: number;
  heightCentimetres: number;
  startingWeightKilograms: number;
  targetWeightKilograms: number;

  // Drives which exercises the programme is allowed to prescribe.
  painAreas: PainArea[]; // 'neck' | 'lowerBack' | 'shoulders' | 'knees' | 'hips' | 'ankles'
  excludedExerciseIds: string[]; // hard blacklist, e.g. from a physio
  unavailableExerciseIds: string[]; // machines his gym has not got. Swapped, not dropped
  availableEquipmentIds: string[]; // what his gym actually has

  trainingDaysOfWeek: number[]; // 0 = Sunday. Default [1, 3, 5]
  hasCompletedOnboarding: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

### `settings/current`

```ts
type UserSettings = {
  selectedPaletteId: string; // default 'purpleBlue'
  coachVerbosity: 'minimal' | 'standard' | 'detailed';
  defaultRestSeconds: number;
  shouldPlayRestTimerSound: boolean;
  shouldKeepScreenAwakeDuringSession: boolean;
  weightUnit: 'kg' | 'lb'; // 'kg'. The switch exists so the UI never assumes
  updatedAt: Timestamp;
};
```

### `programAssignments/{assignmentId}`

Which programme he is on and where he is in it. Historical assignments are kept, so a
finished 12-week block stays readable afterwards.

```ts
type ProgramAssignment = {
  programTemplateId: string; // references src/content/programs/
  startedOn: string; // ISO date
  currentPhaseNumber: number; // 1, 2 or 3
  currentWeekNumber: number; // 1-12
  nextSessionLetter: 'A' | 'B' | 'C';
  status: 'active' | 'completed' | 'abandoned';
  completedOn: string | null;
};
```

### `workoutSessions/{sessionId}`

The big one. Written when a session starts and updated as it progresses, so a dropped
connection mid-workout does not lose the sets already done.

```ts
type WorkoutSession = {
  programAssignmentId: string;
  sessionLetter: 'A' | 'B' | 'C';
  phaseNumber: number;
  weekNumber: number;

  startedAt: Timestamp;
  completedAt: Timestamp | null;
  status: 'inProgress' | 'completed' | 'abandoned';

  performedExercises: PerformedExercise[];

  totalVolumeKilograms: number; // sum of weight x reps. Denormalised for the charts
  durationSeconds: number | null;
  sessionNotes: string | null;
  overallFeeling: 'strong' | 'normal' | 'rough' | null;
};

type PerformedExercise = {
  exerciseId: string; // references src/content/exercises/
  orderIndex: number;
  performedSets: PerformedSet[];
  wasSkipped: boolean;
  skipReason: string | null;
};

type PerformedSet = {
  setNumber: number;

  // Null for bodyweight and unloaded movements. See the note in section 3.
  prescribedWeightKilograms: number | null;
  prescribedReps: number;

  actualWeightKilograms: number | null;
  actualReps: number;

  // Drives the auto-regulation described in TRAINING_PROGRAM.md section 7.
  effortRating: 'easy' | 'justRight' | 'brutal';

  // Distinct from effort. Sharp or joint pain triggers a safety response,
  // muscle burn does not.
  didCauseSharpPain: boolean;

  completedAt: Timestamp;
  restSecondsTaken: number | null;
};
```

### `bodyMetrics/{metricId}`

```ts
type BodyMetricEntry = {
  recordedOn: string; // ISO date
  weightKilograms: number | null;

  // Optional from day one. Waist is a better fat-loss signal than the scale, so the
  // fields exist ready for a tape measure, and the UI simply hides empty ones.
  waistCentimetres: number | null;
  chestCentimetres: number | null;
  hipsCentimetres: number | null;

  notes: string | null;
  createdAt: Timestamp;
};
```

### `dailyHabits/{yyyy-mm-dd}`

```ts
type DailyHabitRecord = {
  onDate: string; // matches the document id
  didHitProteinTarget: boolean;
  didAvoidLiquidCalories: boolean;
  didCompleteMobilityRoutine: boolean;
  stepCount: number | null;
  sleepHours: number | null;
  updatedAt: Timestamp;
};
```

### `personalRecords/{exerciseId}`

```ts
type PersonalRecord = {
  exerciseId: string;
  bestWeightKilograms: number;
  bestRepsAtBestWeight: number;
  estimatedOneRepMaxKilograms: number; // Epley. See src/domain/
  achievedOn: string;
  achievedInSessionId: string;
};
```

### `journalEntries/{entryId}`

Free text, written in the app during the week. **Append only** — there is no edit and no
delete, because an entry is a record of what somebody thought on a day and an edit would
rewrite the history a coaching review reads.

```ts
type JournalEntry = {
  // Exactly what was written. Trimmed at its ends and nowhere else.
  bodyText: string;

  entryKind: 'reflection' | 'question' | 'concern';

  // The day it is ABOUT, which is not always the day it was typed. A note
  // written at ten past midnight is about the session that finished at nine.
  aboutDate: string; // ISO date
  writtenAt: Timestamp;

  // A workoutSessions document id, an exercise in src/content/exercises/, or
  // null. Most entries are about the week in general and tag neither.
  aboutSessionId: string | null;
  aboutExerciseId: string | null;

  reviewStatus: 'awaitingReview' | 'reviewed';
  reviewedAt: Timestamp | null;
};
```

**Nothing sets `reviewStatus` to `reviewed` yet**, and that is deliberate rather than
unfinished. Storing what a coaching review concluded is the write-back half of M10, which is
explicitly not scheduled — see the M10 section of [PROGRESS.md](PROGRESS.md). The field is
written from the first entry anyway, because adding it later would mean backfilling every
document that predates it, and `readJournalEntriesAwaitingReview` already queries on it.

## 4. Security rules

The entire ruleset. It is short on purpose.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // A signed-in user may read and write their own subtree, and nothing else.
    // There is no shared data in this application, so there is no other rule.
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Everything else is denied, including the users collection itself.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

These live in `firestore.rules` at the repository root and are deployed with
`firebase deploy --only firestore:rules`. They were written and deployed in M4 — see
[SETUP_FIREBASE.md](SETUP_FIREBASE.md) step 5.

Note what the ruleset does **not** contain: any per-collection rule, any field validation,
any index declaration. One person owns one subtree, and every query the repositories make is
single-field so Firestore indexes it automatically. `firebase.json` ships rules and nothing
else.

## 5. What is and is not a secret here

The `firebaseConfig` object committed to this repository looks alarming in a public repo.
It is not a credential.

| Value                              | What it actually is                                                       |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `apiKey`                           | A project identifier that routes requests. It grants no access on its own |
| `authDomain`, `projectId`, `appId` | Public identifiers                                                        |

This is [documented by Google](https://firebase.google.com/docs/projects/api-keys):
Firebase web API keys identify a project, they do not authorise access to it. Access is
controlled entirely by:

1. **Firestore security rules** (section 4) — one account, its own data, nothing else.
2. **Authorised domains** in Firebase Auth — sign-in only works from the GitHub Pages
   domain and `localhost`. A copy of this config pasted into another site cannot sign in.

### The one thing that is a secret

A **service account key** is a real credential: it authenticates as the project, and the
rules in section 4 do not apply to it. One exists, and it is worth being precise about why.

Deploying the security rules needs credentials. Until M9 that happened from a laptop, by
hand, which is how a project ends up with rules live that do not match the rules in the
commit that is live. The deploy now runs in CI, so CI needs to authenticate, so a key
exists.

| Where it lives                                       | Notes                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| The `FIREBASE_SERVICE_ACCOUNT` GitHub Actions secret | The only secret this repository has. Write-only in the GitHub UI once saved                                               |
| On a CI runner, for the length of one job            | Written to the runner's temporary disk from an environment variable, never onto a command line, and deleted afterwards    |
| **Never in this repository**                         | `.gitignore` covers the filenames the Google console suggests, but the real defence is that nothing generates one locally |

It carries two roles and no more:

| Role                                                               | What it allows                                                                                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Firebase Rules Admin** (`roles/firebaserules.admin`)             | Publishing a ruleset. The one doing the work                                                                                           |
| **Service Usage Viewer** (`roles/serviceusage.serviceUsageViewer`) | Reading which Google APIs are enabled on the project. The Firebase CLI checks that Firestore is switched on before it deploys anything |

The second one is not optional and is not a widening worth worrying about: it reads a list
of which APIs are on, and grants nothing over any data. **Neither role can read the
database** — see section 3, there is nothing in Firestore but one user's training log, and
this key does not grant access to it.

**If it ever leaks, revoke it.** Google Cloud console -> IAM & Admin -> Service Accounts ->
Keys -> delete, then create a new one and update the GitHub secret. Nothing in the app
breaks in the meantime; only the deploy stops working, which is the correct failure
direction.

### The one that reads the database, and why it is not a key

M10 added `npm run coach:export`, which reads every collection above and writes a coaching
bundle to `.coaching/`. That is a script with read access to the entire training log, so it
is worth being equally precise about what it authenticates with: **your own Google account**,
through Application Default Credentials.

```bash
gcloud auth application-default login   # once, ever
```

A second service account key would have been simpler to write and much worse to own. The
existing key is narrow enough that leaking it means a failed deploy; a key that could read
this data, sitting on a laptop, is a different category of thing. ADC has no file to leak,
expires on its own, and revoking it is revoking your own session. See
[tools/coaching/README.md](../tools/coaching/README.md).

**`.coaching/` is gitignored**, and that is load-bearing rather than tidy: a bundle is body
weight, every session and every journal entry — precisely the personal data section 1 exists
to keep out of a public repository.

An earlier version of this document said no service account key should ever exist for this
project. That was true while rules were deployed by hand, and the trade was made
deliberately: one narrow credential in one secret store, in exchange for the app and its
security rules never disagreeing again. See
[DEPLOYMENT.md section 6](DEPLOYMENT.md#6-why-the-rules-deploy-from-ci-and-in-that-order).

## 6. Cost

Firestore's free tier allows 50,000 document reads and 20,000 writes per day.

A heavy day for this app is roughly: 1 session x ~30 sets = 30 writes, plus a handful of
habit and metric writes, plus maybe 100 reads. That is about **0.2% of a single day's free
allowance**. This will not cost money.

The coaching export is the most expensive single thing either caller does — six queries whose
windows are set by `COACHING_EXPORT_LIMITS`, so at most a few hundred documents. It happens
because somebody pressed a button, not because a screen opened, and even a bundle exported
every day is a rounding error against the same allowance.

## 7. Offline

Full offline support was explicitly descoped. Firestore's built-in local cache is enabled
anyway (`persistentLocalCache`) because it is one configuration line and it makes brief
signal drops in the gym invisible — writes queue locally and flush on reconnect.

There is no service worker and no asset precaching. If the gym has genuinely no signal on
first load, the app will not start. That was an accepted trade.

## 8. Starting again from a clean slate

Sometimes the database holds a session nobody actually trained — a walk through the app
during development that reached the end of the session player and wrote a real
`workoutSessions` document. That session is indistinguishable from a real one to everything
downstream: the Today screen says you trained yesterday, the calendar draws a completed day,
progression reads it as evidence and prescribes off it.

There is no reset button in the app, and there should not be. Deleting training history is a
once-a-project operation with no undo, and a control that does it does not belong on a screen
somebody is tapping one-handed in a gym.

**Do it in the Firebase console**, at
[console.firebase.google.com](https://console.firebase.google.com) → `second-body-osi` →
Firestore Database → `users` → the single user document.

Delete these three subcollections in full:

| Subcollection        | Why it goes                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `workoutSessions`    | The sessions themselves. This is what makes Today say you trained, and what progression reads                 |
| `personalRecords`    | Derived from those sessions. Leaving them behind would show bests for lifts with no session behind them       |
| `programAssignments` | Holds `startedOn` and the A / B / C position. Leaving it starts week 1 from whenever the app was first opened |

Keep everything else. `profile` and `settings` are the real onboarding answers, and deleting
them means answering height, weight, goals, pain areas and gym equipment again for no gain.
`bodyMetrics`, `dailyHabits` and `journalEntries` are only there if they were genuinely
written.

**Deleting `programAssignments` is safe and is the point.** `useTrainingOverview` builds a
starting assignment in memory when there is none stored and deliberately does not save it —
see the note at the top of that hook. The assignment is written for real by `prepareSession`
at the moment a session actually starts, so the twelve weeks begin on the day of the first
real session rather than on the day somebody first opened the app.

Afterwards the app should say week 1, session A, nothing completed, and the calendar should
have no filled days at all. If it still says you trained, the browser is holding a cached
read — Firestore's `persistentLocalCache` is enabled (section 7). Close and reopen the
installed app.
