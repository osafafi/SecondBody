# Settings

Everything the user can change about the app, plus the answers the programme is built on.

**Status:** started in **M1** (the palette picker), finished in **M8**.

## What is here

| Section                       | What it changes                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| **Appearance**                | `selectedPaletteId`. Applies instantly, everywhere, and follows the account        |
| **Coaching and sessions**     | `coachVerbosity`, `shouldPlayRestTimerSound`, `shouldKeepScreenAwakeDuringSession` |
| **Profile**                   | Name, height, target weight, training days, pain areas                             |
| **What your gym has not got** | `unavailableExerciseIds`. The undo for a machine flagged mid-session               |
| **Coaching export**           | The whole training history as one file, for a conversation outside the app         |
| **Account**                   | Who is signed in, and signing out                                                  |
| **Credits**                   | The animation attribution. Required, not decorative                                |

## The three writes, and why they behave differently

- **Preferences** (`useEditableUserSettings`) are written a field at a time and applied
  optimistically. They are switches, and a switch that waits for a round trip before it moves
  gets flicked twice. A failed write puts the old value back.
- **The profile** (`useEditableProfile`) is a form with a save button. Every field on it is
  something the programme is built from, so a half-typed height must not be written on its
  way to a whole one. Nothing is saved until it is asked for and `findProfileEditProblems`
  has nothing to say about it.

- **The unavailable list** (`useEditableUnavailableExercises`) is neither. It is a list you
  remove things from — one row, one action, written immediately, no save button. Waiting for
  a form submission before a machine the gym bought last week counts as bought would be the
  wrong shape for it, and it writes one field rather than the whole document so it cannot
  undo a profile edit made on this same screen a moment earlier.

There is no profile _read_ here. `UserProfileProvider` already watches `profile/current` for
the life of the app, so the form is handed the new values back through context after a save.

## Why the unavailable list is editable and the blacklist is not

`excludedExerciseIds` is deliberately absent from this screen, and
`src/domain/profileEditing.ts` says why: it exists for something a physio ruled out, and
that should not be one mis-tap away from being switched back on.

`unavailableExerciseIds` is the opposite case and needs exactly the opposite treatment. It
is set in a gym, one-handed, on a screen built to be quick — so it _has_ to be undoable, or
a mis-tap silently changes every future session with no way back. Same shape of field, two
different reasons, two different answers.

## What may be edited, and what may not

`src/domain/profileEditing.ts` owns that decision and gives a reason for each exclusion. In
short: the starting weight is the baseline the whole weight trend is measured from, the
equipment list belongs to the gym rather than to the person, and the excluded-exercise
blacklist exists for something a physio ruled out — it should not be one mis-tap from being
switched back on.

The plausibility bounds are **imported from `onboardingValidation.ts`**, not restated. A
height the onboarding form accepts and the settings form rejects is the sort of disagreement
nobody finds until it happens to them.

## Two stored preferences are deliberately not offered

`UserSettings` has two fields with no control on this screen:

- **`defaultRestSeconds`** — nothing reads it. Every rest interval comes from the programme's
  own `restSecondsBetweenSets`.
- **`weightUnit`** — nothing renders it. Every weight in the app is shown in kilograms, and
  every prescribed weight is calculated against kilogram plates.

Both are left off because a switch that changes nothing is worse than no switch. They wait
until there is something behind them.

## The coaching export

**Download my training data** builds the bundle described in
[tools/coaching/README.md](../../../tools/coaching/README.md): the programme, every session,
the scale, the habits, the records and every journal entry, as one JSON file.

Two things about it are deliberate.

**It is the same file `npm run coach:export` writes.** The app reads Firestore with the web
SDK and the script reads it with `firebase-admin`, then both hand what they read to
`assembleCoachingBundle` in `src/domain/` and both ask `findCoachingContentFacts` for the
content half. Everything after the read is one pure function, which is the only way two
processes using two libraries can produce identical bytes. There is a test pinning that the
shared assembly is deterministic.

**The panel says what is in the file, on the screen.** This is personal data leaving a phone,
and "your programme, every session, the scale, the habits, your records and every note in the
journal" belongs where the button is rather than only in a document nobody opens.

`saveTextFileToDevice.ts` is the only DOM-poking in this feature and is kept in its own module
so the hook above it stays a matter of reads and a pure build.

## Where the palette lives

In two places, on purpose:

- **localStorage** is read synchronously during the first render by `ColorPaletteProvider`,
  so the app never paints in the default colours and then flips. Firestore cannot do that job
  — it has not answered yet at that point.
- **`settings/current`** is the source of truth, so the choice follows the account to a new
  phone or a browser that has never seen this app.

`useStoredColorPaletteSync` (`src/hooks/`, called from `AppShell`) reconciles them once per
launch: if the account disagrees with the cache, the account wins and the cache is corrected.
M1 left a note saying M4 would do this. It landed in M8.
