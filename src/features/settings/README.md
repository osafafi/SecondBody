# Settings

Everything the user can change about the app, plus the answers the programme is built on.

**Status:** started in **M1** (the palette picker), finished in **M8**.

## What is here

| Section                   | What it changes                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **Appearance**            | `selectedPaletteId`. Applies instantly, everywhere, and follows the account        |
| **Coaching and sessions** | `coachVerbosity`, `shouldPlayRestTimerSound`, `shouldKeepScreenAwakeDuringSession` |
| **Profile**               | Name, height, target weight, training days, pain areas                             |
| **Account**               | Who is signed in, and signing out                                                  |
| **Credits**               | The animation attribution. Required, not decorative                                |

## The two writes, and why they behave differently

- **Preferences** (`useEditableUserSettings`) are written a field at a time and applied
  optimistically. They are switches, and a switch that waits for a round trip before it moves
  gets flicked twice. A failed write puts the old value back.
- **The profile** (`useEditableProfile`) is a form with a save button. Every field on it is
  something the programme is built from, so a half-typed height must not be written on its
  way to a whole one. Nothing is saved until it is asked for and `findProfileEditProblems`
  has nothing to say about it.

There is no profile _read_ here. `UserProfileProvider` already watches `profile/current` for
the life of the app, so the form is handed the new values back through context after a save.

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
