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
```

`dailyHabits` is keyed by ISO date (`2026-09-01`) rather than a random id, so a day can be
read or written directly without a query. `personalRecords` is keyed by exercise id for the
same reason.

## 3. Document shapes

Types live in `src/types/`. These are the shapes, in TypeScript, with the fields named the
way they are actually named.

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
  prescribedWeightKilograms: number;
  prescribedReps: number;

  actualWeightKilograms: number;
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
`firebase deploy --only firestore:rules`.

## 5. Why the Firebase config is not a secret

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

What genuinely _would_ be a secret is a service account key (`serviceAccount.json`). One of
those must never enter this repository. `.gitignore` covers the usual filenames, but the
real defence is not generating one — this app has no server and does not need one.

## 6. Cost

Firestore's free tier allows 50,000 document reads and 20,000 writes per day.

A heavy day for this app is roughly: 1 session x ~30 sets = 30 writes, plus a handful of
habit and metric writes, plus maybe 100 reads. That is about **0.2% of a single day's free
allowance**. This will not cost money.

## 7. Offline

Full offline support was explicitly descoped. Firestore's built-in local cache is enabled
anyway (`persistentLocalCache`) because it is one configuration line and it makes brief
signal drops in the gym invisible — writes queue locally and flush on reconnect.

There is no service worker and no asset precaching. If the gym has genuinely no signal on
first load, the app will not start. That was an accepted trade.
