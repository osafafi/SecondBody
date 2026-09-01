# Exercise library

Every movement the app knows, outside any session.

**Status:** built in answer to **F2** in [FEEDBACK.md](../../../docs/FEEDBACK.md).

## Why it exists now and not before

`APP_ROUTE_PATHS.exerciseLibrary` was a reserved path with no screen behind it from M3 until
now, on the reasoning that an animation is wanted _in_ a session and nowhere else. F2 existed
to force the question: build it or delete the constant.

Omar answered it by asking for it. The reasoning was wrong in a specific way — it assumed the
only reason to look at an exercise is to be about to perform it, and the first time somebody
wants to know what a Pallof press is on a Tuesday afternoon, there is nowhere to look.

## The two screens

| Screen                  | Path                   | What it is                                                          |
| ----------------------- | ---------------------- | ------------------------------------------------------------------- |
| `ExerciseLibraryScreen` | `/library`             | Every movement, searchable and filterable by kind                   |
| `ExerciseDetailScreen`  | `/library/:exerciseId` | One movement in full: animation, muscles, equipment, cues, mistakes |

## It reads nothing

Both screens read only `src/content/`. There is no loading state, no error state, and nothing
on either of them that can go stale — they are the only screens in the shell that draw
themselves completely on the first render.

They still sit inside the authentication and onboarding gates. Not because they need a
profile, but because a screen inside the shell needs the bottom navigation under it to get
back out of.

## This is not a second copy of the exercise brief

`activeSession/components/ExerciseBriefPanel.tsx` shows the same cues, the same mistakes and
the same reason. It also shows a prescription, a weight, a set count and two buttons, none of
which mean anything outside a session.

What the two share is the **content**, not the component: both read
`src/content/exercises/`, so correcting a form cue corrects it in the gym and in the library
at once. Features may not import from each other in any case — see
[CLAUDE.md](../../../CLAUDE.md) section 3.

## Where the search rules live

`src/domain/exerciseLibrarySearch.ts`, with tests. Two things about it are worth knowing
before changing it:

- **Everything is normalised to letters and digits on both sides.** Ids are camelCase, muscle
  groups are camelCase, and a person types with spaces. That is what makes "lat pulldown"
  find `latPulldown` and "front delts" find `frontDeltoids`, without a synonym table nobody
  would maintain.
- **Form cues and common mistakes are deliberately not searched.** They are paragraphs, and
  including them turns a search for "shoulder" into a search that returns most of the library.

A multi-word search means "every word matches somewhere", not "these words in this order".

## The ways in

Not the bottom navigation. Four targets across a phone is comfortable and five is fiddly —
the note on `BottomNavigation`, and the same reason the journal is not there either.

- The two-link row at the bottom of Today
- The Schedule screen's header
- Every movement row on a session, planned or logged, in `features/schedule/`
