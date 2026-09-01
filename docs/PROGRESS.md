# Progress Log

**If you are an agent picking this project up, read this file first.**

It records what has been built, what is being built, and what is next. Every session must
add an entry. An unrecorded session is a session the next person has to reverse-engineer.

---

## Current state

|                       |                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Current milestone** | M10 — the training journal. **The last milestone on the list**                                                                |
| **Status**            | Built on `feat/training-journal`, not yet pushed. `npm run verify` is green                                                   |
| **Current branch**    | `feat/training-journal`, branched off `main`                                                                                  |
| **App runs?**         | Yes — `npm run dev`. Sign in, onboard, then all four tabs plus the journal are real                                           |
| **Backend wired?**    | Yes. Every collection in the data model has a caller both ways                                                                |
| **Deployed?**         | Not yet. `build` is green; `deploy-firestore-rules` fails on a missing role, so Pages has never run. Nothing has half-shipped |

> **Read session 6 before touching the exercise animations.** The generated SVGs are gone.
> The media is now sourced from an open dataset, and it is **not this project's to
> redistribute freely** — see [EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md) section 2.

### What to do next

**The deploy gets as far as the rules job and stops there.** One thing is Omar's, in the
Google Cloud console, and it takes a minute:

1. **Check both roles are actually on the service account** — SETUP_FIREBASE.md,
   "Checking which roles are actually granted". They must be **Firebase Rules Admin** and
   **Service Usage Viewer**, and they are listed on the IAM page, not on the Service Accounts
   page. Service Usage Viewer is confirmed present — the precheck it covers now passes — and
   Firebase Rules Admin appears not to be. No new key and no new service account is needed.
2. Confirm **Settings -> Pages -> Source: GitHub Actions** — DEPLOYMENT.md section 3. Pages
   has never run, so this has not been exercised yet either.

**Then walk a real session in a gym.** This has been the top of this list since M5 and it is
still the top of it. Every screen in M5 through M8 has been read back panel by panel and
every rule has a test, but nobody has logged a real set on a real phone with a real
Firestore behind it. M9 was the thing standing in the way; once the Pages URL exists, it is
just a case of going.

**M10 is built and every milestone on the list is done.** `feat/training-journal` is waiting
to be pushed. What is left is not code: it is the two console steps above, a real session in
a real gym, and then a few weeks of actually using it before deciding what the next thing is.

**`npm run coach:export` has never been run against the real project.** It is tested where a
test can reach — the argument parsing, the assembly, the determinism — but the half that
talks to `firebase-admin` has only ever been reasoned about. The first run needs
`gcloud auth application-default login` and it needs data in Firestore to be worth anything,
so it is properly exercised on the same trip as the gym session, not before.

**There are no `ComingSoonPanel`s left, and the component is gone.** M8 was the milestone it
was supposed to die in, so it was deleted rather than left as dead code with a doc comment
promising it would be. M10 needed no placeholder — the journal shipped as a real screen.

**Three things M8 finished that earlier milestones started:**

- **`settings/current` is finally written.** It has been read since M4 by the session
  player, Today and Progress, and until now every value in it was whatever
  `DEFAULT_USER_SETTINGS` said.
- **The palette follows the account**, not just the browser. M1 left a note saying M4 would
  do this; it landed here. localStorage is now explicitly the cache and Firestore the source
  of truth — see `useStoredColorPaletteSync`.
- **`dailyHabitsRepository` has callers in both directions.** It was written in M4 and had
  been read by nothing since.

**Two stored preferences are deliberately still not editable**, and this is worth knowing
before someone "finishes the settings screen": `defaultRestSeconds` is read by nothing
(rest comes from the programme's own `restSecondsBetweenSets`) and `weightUnit` is rendered
by nothing (every weight in the app is kilograms). Putting switches on them would be
shipping two controls that change nothing. They are noted in the settings README.

**A new milestone was agreed with Omar during M7: M10, the training journal.** It is the
capture-and-export half of a larger idea — being able to write things down in the app during
the week, then open Claude Code at home and have the context already there to talk about it.
The write-back half (a review that can adjust the programme) is deliberately not scheduled
yet. See the M10 row and the session 12 entry below for the shape of it and for why it sits
after deployment rather than before.

**Every Firebase setup step is done and verified, except the one M9 added.** The project
exists (`second-body-osi`, me-central1), Google Sign-In is on, Firestore is created, the
rules are deployed and the authorised-domain list is correct — do not ask Omar for any of
that again, read sessions 8 and 9 first. **The new one is step 8**, the
`FIREBASE_SERVICE_ACCOUNT` secret, and it is outstanding.

**The security rules are no longer deployed by hand.** Every push to `main` redeploys them,
from the same run and the same commit as the app, before the Pages deploy. If you change
`firestore.rules`, that is the whole procedure — do not run `firebase deploy` locally, the
next push would overwrite it anyway. The one case that needs care is a rules change that
_removes_ a permission the live app still uses, which needs two releases;
[DEPLOYMENT.md section 6](DEPLOYMENT.md#6-why-the-rules-deploy-from-ci-and-in-that-order)
explains why and in which order.

---

## Milestones

One branch and one pull request each. Do not mix milestones.

| #   | Branch                         | Contents                                                                                      | Status   |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------- | -------- |
| M0  | `feat/repo-foundation`         | Git, Vite + TS scaffold, lint, format, tests, all docs, CI                                    | **Done** |
| M1  | `feat/design-system`           | Tokens, palettes, `GradientSurface` and primitives, app shell, bottom nav, palette switcher   | **Done** |
| M2  | `feat/training-content`        | Exercise database, 12-week programme, mobility routines, coach voice, `domain/` logic + tests | **Done** |
| M3  | `feat/exercise-media-pipeline` | Media spec, dataset match table, copy tool, verifier, 27 animations + 9 fallbacks             | **Done** |
| M4  | `feat/firebase-data-layer`     | Firebase init, Google Sign-In, typed repositories, security rules, onboarding                 | **Done** |
| M5  | `feat/active-session`          | Session player state machine, set logging, rest timer, wake lock                              | **Done** |
| M6  | `feat/dashboard-and-schedule`  | Today screen, calendar, 48-hour recovery awareness                                            | **Done** |
| M7  | `feat/progress-tracking`       | Weight trend, volume charts, personal records                                                 | **Done** |
| M8  | `feat/habits-and-settings`     | Daily habit checklist, quick weigh-in, settings screen, profile editing                       | **Done** |
| M9  | `feat/pages-deployment`        | Deploy workflow, Firestore rules deployed from CI, web manifest, generated icons              | **Done** |
| M10 | `feat/training-journal`        | Free-text journal, the coaching export bundle, and the `coach-review` skill                   | **Done** |

### M10, and why it is last

M10 is the capture half of something Omar asked for during M7: an LLM he can talk to about
his training, in Claude Code, with the data already in front of it. The app does not get an
LLM — there is no server, no API key in a public static site, and no cost. The app becomes
the memory instead.

Three parts, of which **only the first two are M10**:

1. **Capture.** A `journalEntries` collection under the user document — free text, written in
   the app during the week: a reflection after a session, a question on a rest day, a
   concern about a knee. Stored verbatim, never summarised on write, tagged with the session
   or exercise it is about, and carrying a `reviewStatus` so "everything since the last
   review" is one query rather than a re-read of everything.
2. **Retrieval.** A bundle builder in `src/domain/` — pure, so it is tested like everything
   else there and so both ways of getting at it produce identical output. Two callers: a
   download button in Settings, and `npm run coach:export`, a Node script using
   `firebase-admin` with Application Default Credentials (`gcloud auth application-default
login`) so that **no service account key file ever exists** — see DATA_MODEL section 5.
   Output goes to `.coaching/`, which must be gitignored: it is precisely the personal data
   CLAUDE.md rule 2 exists to keep out of this repository. The bundle is not a Firestore
   dump; it resolves exercise ids to names, collapses sets to tuples, and precomputes the
   aggregates the existing domain functions already produce.
3. **The write-back — not scheduled.** A review that can store what was concluded and, when
   it is worth it, a small closed vocabulary of adjustments the app knows how to honour.
   Left unscheduled on purpose: it is the half that changes what weight goes on the bar, and
   it should not be built until there are real weeks of real data to be wrong about.

**Why after deployment rather than before.** Journal entries are only worth reviewing if
they are being written, and they will not be written until the app is on his phone every
day — which is M9. Building the capture surface first would accumulate an empty collection.
If M8 and M9 slip a long way, this ordering is worth revisiting; the code has no dependency
on either.

---

## Session log

### Session 1 — 2026-08-31 — M0 repository foundation

**Agent:** Claude (Opus 5)
**Branch:** `feat/repo-foundation`

**Done**

- Interviewed Omar across 16 questions covering training capacity, medical status, pain,
  experience, preferences and every technical decision. All answers are recorded in
  [TRAINING_PROGRAM.md](TRAINING_PROGRAM.md) section 1 and in the decision table below.
- `git init` on `main`, then branched to `feat/repo-foundation`.
- Hand-written Vite + React 19 + TypeScript 6 scaffold (not `npm create vite`, so every
  config file is deliberate and commented).
- Tooling: ESLint 10 with typescript-eslint, Prettier, Vitest with jsdom and Testing
  Library, `npm run verify` as the single pre-commit gate.
- Strict TypeScript, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- `@/*` path alias to `src/*`.
- Wrote the full documentation set: README, CLAUDE.md, ARCHITECTURE, TRAINING_PROGRAM,
  DESIGN_SYSTEM, DATA_MODEL, EXERCISE_MEDIA_SPEC, SETUP_FIREBASE, DEPLOYMENT, ROADMAP.
- CI workflow running type-check, lint, tests and build on pull requests.
- Toolchain smoke test proving React + jsdom + Testing Library work end to end.

**Decisions made and why**

| Decision                               | Reason                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript 6.0.3, not 7.0.2            | `typescript-eslint@8` declares a peer range of `>=4.8.4 <6.1.0`. TS 7 would silently disable type-aware linting                                         |
| CSS Modules, not Tailwind              | The palette must be swappable at runtime via CSS custom properties, which Tailwind's build-time model fights                                            |
| `HashRouter` + `base: './'`            | Removes both GitHub Pages SPA problems at once — the sub-path and 404-on-refresh — with no `404.html` hack and no coupling to the repository name       |
| Content in git, user data in Firestore | The repository is public. Exercises and programmes are reviewable content; body weight is not                                                           |
| Animated SVG for exercise media        | The codex CLI is authed via ChatGPT, so it has no image-API access. It writes code instead — which also gives palette-reactive, 5 KB, reviewable assets |
| Hand-written scaffold                  | Every config line is intentional and commented, rather than inherited from a template nobody read                                                       |

**Notes for the next session**

- `jsdom@30` warns that it wants Node `>=24.15.0` and this machine has `24.14.0`. Tests
  pass regardless. If jsdom ever misbehaves, upgrade Node rather than downgrading jsdom.
- `firestore.rules` does not exist yet. It arrives in M4. The intended contents are already
  written out in [DATA_MODEL.md](DATA_MODEL.md#4-security-rules).
- Nothing in `src/domain/` yet, so the "everything in domain is tested" rule is not yet
  exercised. M2 is where that starts mattering.

---

### Session 2 - 2026-08-31 - M1 design system

**Agent:** Claude (Opus 5)
**Branch:** `feat/design-system`

**Done**

- **Palette system.** `ColorPaletteDefinition` in `src/theme/colorPaletteTypes.ts` is the
  single contract for every colour in the app. `applyColorPaletteToDocument` writes each
  field onto `:root` as a kebab-case CSS custom property and stamps `data-palette` on the
  root element.
- **Three palettes ship:** `purpleBlue` (default), `emeraldTeal`, `amberCrimson`. Adding one
  is a single file plus a registry line - it then appears in Settings automatically.
- **`GradientSurface`** with five variants (elevated / recessed / accent / glass / outlined).
  Every panel in the app goes through it, which is how "no flat cards or sections" is
  enforced structurally rather than by everyone remembering it.
- **Primitives:** `GradientButton`, `IconBadge`, `ScreenHeader`, `ComingSoonPanel`.
- **App shell** with a radial background wash, a max-width content column, and a floating
  glass bottom navigation with four destinations.
- **Router** on `HashRouter`, with all paths centralised in `src/app/appRoutes.ts`.
- **Settings screen** with a fully working palette picker. Verified in the browser at
  375x812: switching palette instantly recolours titles, icons, glows, borders and the
  navigation, and the choice survives a reload.
- 22 unit tests, all green.

**Decisions made and why**

| Decision                                                  | Reason                                                                                                                                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palette applied in `main.tsx` before `createRoot`         | An effect runs after first paint, so the app would flash in fallback colours and then flip. Applying it synchronously removes that entirely                                                         |
| `color-mix()` for semantic tints instead of rgba literals | An `rgba(52, 211, 153, 0.26)` success wash is frozen to one palette's green. `color-mix(in srgb, var(--success-gradient-start) 26%, transparent)` follows whatever palette is active                |
| Neutral white/black overlays remain allowed               | They are material properties - specular highlights and shadows - not theme colours, and they read correctly in every palette. Documented in DESIGN_SYSTEM.md section 3                              |
| Context split across three files                          | `ColorPaletteProvider.tsx` exports only a component, `useColorPalette.ts` only a hook, `colorPaletteContext.ts` only the context. React Fast Refresh is unreliable when a module mixes export kinds |
| Four navigation items, not five                           | The exercise library is reached from Today and from inside a session, which is where it is actually wanted. Four targets is comfortable for a thumb                                                 |
| `GradientButton` separate from `GradientSurface`          | A tappable thing needs real `<button>` semantics, not just button styling. Keeping them separate stops `GradientSurface` growing an `onClick`                                                       |

**Notes for the next session**

- The active session screen must be registered **outside** `AppShell` so it takes over the
  whole display with no navigation to hit by accident mid-set. There is a comment marking
  the spot in `src/app/App.tsx`.
- `ComingSoonPanel` names the milestone that delivers each screen. Every instance should be
  gone by M8 - if one survives past that, it is a bug.
- `color-mix()` and `backdrop-filter` are both used freely. Both are fine in any current
  mobile browser; do not add fallbacks for browsers this app will never run in.
- Clicking through the in-app browser pane timed out repeatedly during verification, but
  driving the page with `javascript_tool` worked fine. Not an app problem.

---

### Session 3 - 2026-08-31 - M2 training content

**Agent:** Claude (Opus 5)
**Branch:** `feat/training-content`

**Done**

- **Shared vocabulary** in `src/types/`. Movement patterns, muscle groups, equipment, loading
  styles, pain areas, effort ratings — declared once as `as const` arrays so a typo in an
  exercise definition is a type error rather than an unmatched string, and so the integrity
  tests have runtime lists to check against.
- **33 exercises** across six grouped files plus a flat registry. Each one carries form cues,
  the specific ways it goes wrong, why it is in _this_ programme, the pain areas it helps and
  the ones to watch, substitutes, and a `mediaBrief` for M3. Every one of the 33 is referenced
  by the programme, the warm-up or the mobility routine — there is no dead content.
- **The twelve week programme**, written out week by week rather than derived. All three
  phases restate their sessions in full, so what will be trained in week 9 is readable in one
  place instead of assembled from a chain of overrides.
- **The warm-up** with a morning and a standard dose per movement, and the **Desk Undo**
  mobility routine, both referencing the same exercise database as the gym work.
- **58 coach lines** in four files, tagged by moment, verbosity and whether they are praise.
- **Twelve domain modules, 418 tests, all green.** Double progression, the two safety
  reductions, load rounding, session planning, scheduling, layoff recovery, volume, Epley,
  habit targets, coach line selection.
- Amended [TRAINING_PROGRAM.md](TRAINING_PROGRAM.md) sections 3, 7 and 8 with the decisions
  below, so the document and the code do not drift.

**Decisions made and why**

| Decision                                                    | Reason                                                                                                                                                                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The session tables' rep counts are the **top of a range**   | Double progression needs somewhere to climb. "2 x 12" is two sets of 10-12, and the weight moves once both sets reach 12. A fixed 12 gives the rule nothing to fire on                                     |
| Sharp pain outranks a brutal set                            | Both can be true of one session. Taking the larger reduction is the only safe reading of a rail whose whole job is safety                                                                                  |
| Reductions round **down** to a selectable weight            | 40 kg less 20% is 32 kg, and the nearest stack setting is 32.5 — heavier than the reduction asked for. Being wrong on the light side is free; being wrong on the heavy side is the thing we are preventing |
| Prescribed dumbbell weights are **per dumbbell**            | It is the number written on the thing he picks up. Volume calculations multiply by two; the screen does not                                                                                                |
| Carries progress on feel, not on reps                       | A carry has a distance, so there is no top of the range to reach. It goes up only when every set felt easy                                                                                                 |
| Warm-up doses are written out, not computed                 | The right afternoon dose for ankle rocks is a judgement about ankle rocks, not a percentage. Both numbers are in content where they can be argued with                                                     |
| Every warm-up movement is always performed                  | Dropping the shoulder work because it is the afternoon would be a strange way to treat a shoulder. Only the dose varies                                                                                    |
| Phases restate their sessions rather than patching          | Nine session templates is more text than three plus overrides, but week 9 is then readable in one place. Reviewability beats brevity here                                                                  |
| The overhead press is a slot with `requiresPainFreeAreas`   | The programme says "if the shoulders have gone quiet". Making that a data condition means it is enforced by the planner and tested, rather than remembered                                                 |
| `domain/` takes a `resolveLoadingStyleForExercise` function | Session planning needs one fact from content. Passing it in keeps the "domain depends on nothing" rule literally true instead of nearly true                                                               |
| Coach line selection takes a rotation index                 | `domain/` has no randomness. The caller passes a counter, so the same input always produces the same line and the voice still rotates                                                                      |
| Praise is a filter, not a ranking                           | `mayUsePraise: false` removes praise lines entirely and `selectCoachLine` returns null rather than substituting something generic. Silence is part of the voice                                            |
| Phase 2 swaps the two presses rather than adding one        | "Incline dumbbell press replaces some machine pressing" — the free weight goes where he is freshest, the machine stays for the tired slot                                                                  |

**Notes for the next session**

- **The exercise ids that change at a phase boundary reset their history.** Four do, in
  week 9. This is handled — no history means the app prescribes a calibration and asks him to
  find the weight — but it is worth knowing before someone reads it as a bug.
- **`src/components/icons/` still does not exist**, though DESIGN_SYSTEM.md section 7 says the
  concept-to-icon mapping lives there. M2 introduced the concepts (muscle groups, movement
  patterns, equipment, effort ratings, habits) but has no UI to render them. Build it in the
  first milestone that draws them, rather than guessing now.
- **`DailyHabitRecord` in DATA_MODEL.md has five fields, and section 9 of the training
  document lists four habits.** The fifth is the mobility routine from section 10. The content
  in `src/content/habits/` covers all five and says so; the two documents are not actually in
  conflict, but the mismatch reads like one.
- The domain tests for `programPhases` and `sessionPlanning` import the real programme rather
  than a fixture. That is a test importing content, which is allowed; the `src/domain/` source
  files themselves still import nothing but types.
- Nothing in M2 renders, so there was nothing to verify in a browser. The first screen that
  consumes any of this is the active session player in M5.

### Session 4 - 2026-08-31 - Real gym equipment

**Agent:** Claude (Opus 5)
**Branch:** `main` — Omar asked for this one directly on main rather than a milestone branch

Omar walked his building gym and listed what is actually in it. M2's equipment list had been
written from the interview and assumed a commercial gym; four machines it depended on are not
there. The content now matches the room.

**What the gym has**

Leg extension, leg curl, adductor, abductor, shoulder press, chest press, lat pulldown, low
row, cable crossover. Treadmill, bike, rower, elliptical. A free weight area with dumbbells,
bars and several benches.

**Done**

- **`EQUIPMENT_IDS` is now the real inventory**, not a catalogue. Removed `legPressMachine`,
  `hipThrustMachine`, `chestSupportedRowMachine`, `landmineAttachment` and `plyometricBox`;
  added `legExtensionMachine`, `hipAdductorMachine`, `hipAbductorMachine`,
  `shoulderPressMachine` and `ellipticalTrainer`. Because an exercise's
  `requiredEquipmentIds` is typed against this union, content that cannot be performed in
  that room is now a type error.
- **Four exercises replaced.** `legPress` -> `legExtension`, `hipThrust` ->
  `dumbbellHipThrust` (bench and one dumbbell), `chestSupportedRow` ->
  `chestSupportedDumbbellRow` (incline bench and dumbbells), `landminePress` ->
  `shoulderPressMachine`. Each replacement keeps the property that got the original picked:
  back supported, no lumbar load, a machine holding the path for a first overhead press.
- **Three exercises added:** `seatedHipAbduction` (prescribed, Session C),
  `seatedHipAdduction` and `ellipticalEasy` (defined, reachable as substitutes).
- **`gobletSquatToBox` squats to a flat bench** rather than a plyo box, which is what is
  actually there. Same movement, same id, so no history is lost.
- **Session A was reordered.** With no leg press, the goblet squat is the biggest leg
  movement and goes first; the leg extension takes slot 4 and does the direct quad work the
  leg press was there for.
- **Session C is now seven slots** in every phase, with the abductor machine straight after
  the split squat.
- 36 exercises, 427 tests, all green. `npm run verify` passes.

**Decisions made and why**

| Decision                                                       | Reason                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The barbell RDL comes out of Phase 3                           | It has to be lifted out of a rack at hip height, and no rack was on the list. Starting it off the floor is precisely what section 2 excludes. The dumbbell RDL keeps the slot and gets heavier instead |
| ...but stays defined, as the dumbbell RDL's first substitute   | If there is a rack, putting it back is a one-line change to the Phase 3 template rather than writing an exercise from scratch                                                                          |
| The machine shoulder press keeps `requiresPainFreeAreas`       | It is a truer overhead press than the landmine was, so the shoulder gate matters more, not less. The domain rule and its tests carry over unchanged — only the id moved                                |
| The adductor machine is defined but not prescribed             | Session C is already at the seven-slot ceiling and the adductors are trained on every squat and split squat anyway. It is listed as a substitute for the days a lunge is a bad idea                    |
| The elliptical is defined but not prescribed                   | Same reason. It is the swap when the treadmill is taken, which is what `substituteExerciseIds` is for                                                                                                  |
| The dumbbell hip thrust is `singleDumbbell`, starting at 12 kg | One dumbbell across the hips, held with both hands. That is the number written on the thing he picks up, which is the convention M2 already set for dumbbells                                          |
| Equipment ids kept their names where the kit did               | `seatedCableRowMachine` still backs the "Low row" in his gym, and `cableStation` still backs the crossover. Renaming ids for a label change would churn content for nothing                            |

**Notes for the next session**

- **Two things are worth confirming with Omar, and neither blocks anything.** Whether the leg
  curl is seated or lying (the cues in `seatedLegCurl` assume seated), and whether there is a
  rack or squat stand anywhere in the free weight area (which would put the barbell RDL back
  into Phase 3).
- **Starting weights for the new machines are guesses**, as every starting weight in this
  programme is: 30 kg leg extension, 25 kg abduction, 15 kg shoulder press. Week 1 is a
  calibration week precisely so these get corrected by reality.
- **`src/domain/` was not touched.** Every change was content and the tests that read it. The
  conditional-slot rule, double progression and the two safety reductions all work exactly as
  they did — only the exercise ids they operate on changed.
- The domain tests that used `legPress` as their worked example now use `legExtension` at
  30 kg. The deload assertion still exercises the round-down rule: 30 kg less twenty percent
  is 24, and the nearest selectable weight at or below that is 22.5.

---

### Session 5 - 2026-08-31 - M3 exercise media pipeline

**Agent:** Claude (Opus 5)
**Branch:** `feat/exercise-media-pipeline`

**Done**

- **The exemplar**, `public/exercise-media/_exemplar-seated-cable-row.svg`, hand-drawn and
  hand-checked. It is not only a style reference: it is a **rig**. Every limb is a capsule
  drawn from `(0,0)` down its own +Y axis, so its joint is its origin and the whole animation
  is one `rotate()` per segment about `transform-origin: 0 0`. That turns the generator's job
  from "draw a person" into "work out the joint angles", which is the difference between
  thirty-six drawings that match and thirty-six that do not.
- **`tools/exercise-media/validateExerciseSvg.mjs`** — every requirement in the contract that
  a machine can check, with failure messages that name the requirement number. **27
  tests**, each breaking exactly one rule in a known-good file, so the suite could not pass by
  rejecting everything.
- **`tools/exercise-media/generateExerciseSvg.mjs`** — builds a prompt from the specification,
  the exemplar and the exercise's own `mediaBrief`, form cues and common mistakes, runs
  `codex exec`, and writes the file **only once the validator accepts it**.
- **`tools/exercise-media/exerciseMediaContract.mjs`** — the machine-readable half of the
  specification, plus the code that reads the training content and works out what to draw next.
- **All 36 exercises drawn**, in the order the programme needs them: Phase 1 and the warm-up
  first, then what Phases 2 and 3 add, then the mobility-only drills, then the three that
  exist only as substitutes. 31 passed the contract on the first attempt and 5 on the second;
  none needed a third. Median file is 6.8 KB against a 12 KB budget.
- **`ExerciseAnimation`** — fetches the file and inlines it into a **shadow root**. Both halves
  of that matter, and the reasons are in the decision table below.
- **`src/components/icons/muscleGroupIcons.ts`** — the concept-to-icon mapping
  DESIGN_SYSTEM.md section 7 has been promising since M1, covering muscle groups, which is
  what M3 draws. It is what an exercise falls back to when it has no animation yet.
- **A development-only review screen** at `#/exercise-media`, listing every animation at phone
  size and large, with the palette switcher beside them. It is registered behind
  `import.meta.env.DEV` and is verifiably absent from the production bundle.
- **Amended EXERCISE_MEDIA_SPEC.md**: a new section 5 documenting the rig, the proportions and
  the timing; section 7 rewritten to describe what the generator actually does; and
  requirement 9 now yields to a front view for movements in the frontal plane.
- `npm run verify` passes. 459 tests, all green.

**Decisions made and why**

| Decision                                                         | Reason                                                                                                                                                                                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The exemplar is a rig, and the rig is documented in the spec     | Consistency cannot come from asking nicely. If the exemplar only showed _what_ to draw, every file would invent its own construction. Showing _how_ it is built makes matching it the path of least resistance                    |
| The generator validates **before** writing, not after            | The specification originally said write, then delete on failure. Validating in memory means a broken asset never exists at all — there is no window in which a half-good file is on disk, and nothing to clean up after a bad run |
| A rejected attempt is retried with the failures in the prompt    | "Re-run it, output varies" wastes a two-minute call on the same mistake. Handing back the validator's actual complaints fixes it on the next attempt                                                                              |
| Animations are inlined, never put in an `<img>`                  | An `<img>` is an isolated document that inherits nothing. The palette lives in CSS custom properties on `:root`, so an `<img>` animation would freeze on its fallback colours — losing the entire reason for choosing SVG         |
| ...and inlined into a **shadow root**                            | A `<style>` inside an inlined SVG is not scoped: it applies document-wide. Two animations on one screen would fight over `.torso` and over each other's `@keyframes` names, and their duplicate ids would break `aria-labelledby` |
| Custom properties are the one thing allowed across that boundary | They inherit through a shadow root, which is exactly the property needed: styles stay in, the palette comes through                                                                                                               |
| The tools import the content's TypeScript directly               | Node strips the types and the grouped content files import nothing but types. No build step, and no second copy of the exercise list to drift                                                                                     |
| ...but not the aggregating modules                               | `allExercises.ts` imports its neighbours without file extensions. Vite resolves that; Node's ESM loader does not. The tools list the directory instead, so a new group file is picked up without anyone remembering to come back  |
| Generation order is computed from the programme                  | "Phase 1 first, then Phases 2 and 3, then mobility, then the unprescribed" is a fact about the content. Written down as a list it would be wrong the first time a session changed                                                 |
| The validator requires the primary highlight, not the secondary  | Plenty of exercises genuinely have no secondary muscle group. Whether a given file should have one is a question about that exercise, so it is a test that reads the content rather than a rule the file-local validator applies  |
| Muscle group icons are mnemonic, not literal                     | `lucide-react` has no anatomical set and a second icon library is not allowed. One icon per body region is honest; a distinct glyph for each of the three deltoid heads at 20 px would be false precision                         |
| The review screen is dev-only and sits outside `AppShell`        | It is a tool, not a screen. It needs the full width of a window, which is the one thing the app's phone-width column will not give it — and it must not ship                                                                      |
| A front view is correct for the abduction and adduction machines | The contract says profile facing right. A profile of a movement that happens side to side shows a limb moving straight at the viewer, which reads as not moving at all. Codified in spec section 5 rather than left to be guessed |

**Notes for the next session**

- **The exemplar is not `seatedCableRow.svg`.** It is `_exemplar-seated-cable-row.svg`, and
  the underscore is load-bearing: it sorts first and it is obviously not an exercise id. The
  low row has its own generated file like everything else.
- **Regenerating is cheap and non-destructive.** `npm run media:generate <id> --overwrite`
  redraws one; without `--overwrite` the generator skips anything already drawn, so `--all` is
  resumable after an interruption. Roughly two minutes per exercise, four at a time.
- **If an animation is wrong twice, fix the `mediaBrief`, not the prompt.** The brief is the
  input. Section 9 of the specification says this and it is worth repeating.
- **`ExerciseAnimation` caches a missing file as missing** for the life of the page, so an
  exercise drawn while the review screen is open needs a reload before it appears. That is the
  right behaviour in the app — an exercise with no animation should not fire a losing request
  on every mount — and only ever an inconvenience during a generation run.
- **The browser pane's screenshots lag the page.** Session 2 noted the same thing. Driving the
  page with `javascript_tool` and reading state back is reliable; a screenshot taken
  immediately after an interaction is often the previous frame. Take a second one.
- `src/components/icons/` now exists but covers **muscle groups only**. Movement patterns,
  equipment, effort ratings and habits get theirs in the milestone that first draws them.

### Session 6 - 2026-08-31 - Dataset GIFs replace the generated SVGs

**Agent:** Claude (Opus 5)
**Branch:** `feat/exercise-media-pipeline` — the same branch as session 5, because this
replaces what session 5 built rather than adding to it

Omar looked at the thirty-six generated SVGs and did not like them. He found
[`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset) — 1324
anatomical animations — and asked for the closest GIF for each exercise, with a "no preview
available" fallback for anything that could not be matched, which he would resolve himself.

**Done**

- **The dataset is cloned to `vendor/exercises-dataset`, which is gitignored.** 296 MB, of
  which 269 MB is animations this project does not use. Only the matched files are copied out
  and committed, so nothing after the first copy needs the clone — not the app, not the tests,
  not CI.
- **`src/content/exerciseMedia/exerciseMediaMatches.ts` is the reviewable artefact.** 27
  matches and 9 written refusals. **Every row was chosen by opening the dataset's own
  thumbnail and looking at it**, not by comparing strings — the dataset contains
  `biceps leg concentration curl`, which any fuzzy matcher hands straight to `seatedLegCurl`.
  Each match records the dataset's id and its name; each close match records what differs;
  each refusal records what was searched for and what the nearest miss was.
- **19 exact matches, 8 close ones.** Close means the same movement with something visibly
  different: a band where the gym has a cable (`pallofPress`), an underhand grip where the cue
  says neutral (`chestSupportedDumbbellRow`), shoulders on the floor rather than against a
  bench (`dumbbellHipThrust`, because the dataset has no hip thrust at all).
- **Nine exercises draw "No preview yet".** `rowingMachineEasy`, `catCow`, `wallSlides`,
  `chinTucks`, `bodyweightHipHinge`, `threadTheNeedle`, `ninetyNinetyHipSwitch`,
  `couchStretch`, `doorwayPecStretch`. Seven of the nine are mobility drills, which is not a
  coincidence — the dataset is a strength collection and is thin on corrective work.
- **`tools/exercise-media/copyDatasetGifs.mjs`** copies matched files into
  `public/exercise-media/{exerciseId}.gif`. It refuses to write a file whose dataset record no
  longer carries the name the match table recorded, so a re-clone that shifted ids cannot
  quietly copy a squat over a deadlift.
- **`tools/exercise-media/verifyExerciseMedia.mjs`** proves the table and the committed files
  agree, needs no clone, and runs in CI and inside `npm run verify` through its test.
- **`ExerciseAnimation` now renders an `<img>`** and consults the committed table rather than
  requesting a file and handling a 404.
- **The attribution ships.** A Credits section in Settings, `ATTRIBUTION.md` beside the files,
  and section 2 of the specification. This is a licence condition, not a courtesy.
- **Deleted:** all 36 SVGs including the exemplar, `generateExerciseSvg.mjs`,
  `validateExerciseSvg.mjs` and its 27 tests, and `exerciseMediaContract.mjs`. 449 tests, all
  green.

**Decisions made and why**

| Decision                                                              | Reason                                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A curated table in `src/content/`, not a matching script              | A script would have to be re-run and re-trusted. The judgement of "is this drawing this movement" is made once, by eye, and committed where a pull request can argue with it. It is content, and content is reviewed         |
| A wrong animation is worse than no animation                          | "No preview yet" is visible, honest and fixable. A confidently wrong drawing teaches the wrong movement in a gym and nobody finds out. Nine exercises were refused on that basis rather than given the nearest quad stretch  |
| Close matches carry a written sentence, enforced by the verifier      | The note is the only thing that makes the compromise reviewable. A close match without one is just an unexplained approximation                                                                                              |
| `gobletSquat` and `gobletSquatToBox` share one file                   | The dataset has a goblet squat and a squat-to-a-bench, and neither has both properties. The goblet hold is the cue that matters more, so the bench is what is given up. Recorded in the table rather than hidden             |
| The images are inverted in CSS                                        | The source files are dark line art on white. Untouched, each is a 180 px white square: a glare in a dim gym and the one bright rectangle in a dark app. `invert(1) hue-rotate(180deg)` blackens the ground and keeps the red |
| `<img>`, not the inlined shadow root session 5 built                  | That existed so the SVGs could inherit the palette. A GIF is raster and inherits nothing however it is embedded, so inlining costs lazy loading, off-thread decoding and the browser cache for nothing in return             |
| The committed table decides whether a file exists, not a 404          | Whether an animation exists is committed knowledge, and a test proves the table matches the disk. A phone on gym wifi should not wait out a failed request to learn something that was known at build time                   |
| The `muscle*` palette fields stay, unused — **reversed in session 7** | Seven fields across three palettes, written for the SVGs. Nothing reads them now. Removing them is a design-system change, and hand-drawn media would want them back. Documented as unused in DESIGN_SYSTEM.md instead       |
| `mediaBrief` stays on `ExerciseDefinition`                            | It stopped being a generator input and became a matching input: it is what the candidate thumbnails were checked against. Three sentences describing the movement, next to the form cues, earns its place either way         |
| The clone is gitignored rather than a submodule                       | A submodule makes every future checkout pay 296 MB for 27 files. Copy them out, commit them, and print the clone command when the tool cannot find the clone                                                                 |

**Notes for the next session**

- **The licence needs Omar's attention, and it is the one thing here that is not purely a code
  decision.** The animations are Gym Visual's, redistributed in that dataset with permission,
  at 180×180, with attribution. Its NOTICE is explicit that cloning it is not a licence. This
  repository is public, so committing these files is redistribution. The terms are honoured as
  far as this project can honour them — original resolution, attribution in the app and beside
  the files — but whether to publish them at all is his call. It is written up in
  [EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md) section 2 and in
  `public/exercise-media/ATTRIBUTION.md`.
- **Resolving one of the nine is a three-step job:** find a GIF, put it at
  `public/exercise-media/{exerciseId}.gif`, and move the row from `exercisesWithoutMediaMatch`
  into `exerciseMediaMatches`. The verifier fails loudly if only two of the three are done.
- **The eight close matches are the ones worth a second opinion** on the review screen at
  `#/exercise-media`. `dumbbellHipThrust` is the loosest of them — a barbell glute bridge with
  the shoulders on the floor. If it reads as the wrong exercise, demote it to a fallback.
- **The animations cannot be paused.** A looping GIF in an `<img>` ignores
  `prefers-reduced-motion`, which the old SVGs honoured. Nobody has asked for this and it does
  not justify a control of its own, but it is a real regression and M5 is where it would be
  felt.
- **Screenshots below the fold come back blank** in the browser pane on the review screen.
  Sessions 2 and 5 both noted the pane lagging; this is worse than lag. Removing the earlier
  `<section>` elements with `javascript_tool` and screenshotting at scroll zero is what worked.

### Session 7 - 2026-08-31 - The muscle palette fields come out

**Agent:** Claude (Opus 5)
**Branch:** `feat/palette-contract-cleanup`, branched off `feat/exercise-media-pipeline`

Session 6 replaced the generated exercise SVGs with dataset GIFs and left the seven `muscle*`
colour fields in the palette contract, documented as deliberately unused. **That call is
reversed here.** They are gone.

**Done**

- Removed `muscleBodyFill`, `muscleBodyStroke`, `muscleHighlightPrimary`,
  `muscleHighlightSecondary`, `muscleEquipmentFill`, `muscleEquipmentStroke` and
  `muscleMotionTrail` from `ColorPaletteDefinition` and from all three palettes. Twenty-four
  lines.
- `colorPaletteTypes.ts` keeps a short note where they were, because "why can I not recolour
  the animations" is a reasonable question to arrive at that file with.
- `applyColorPaletteToDocument.test.ts` **replaced** its two muscle references rather than
  deleting them. One was a kebab-case conversion case and the other a spot-check that values
  arrive intact; both were testing the mechanism, not the muscle colours. They are now
  `warningGradientStart` and `--danger-gradient-end`, plus `--text-secondary` so the
  spot-check covers one field per group in the contract.
- `docs/DESIGN_SYSTEM.md` updated: the fields are out of the quoted contract, and the section
  explaining why the animations do not follow the palette says they were removed rather than
  kept.

**Why, given session 6 decided the opposite**

| Session 6 said                            | Why that was wrong                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Removing them is a design-system change" | So is leaving seven dead fields in the document that defines the design system. `colorPaletteTypes.ts` opens by saying every field produces a custom property that components read. That was false for a third of its colour fields                                                |
| "It costs three lines per palette"        | It costs seven **design decisions** per palette, made with nothing to check them against. There is no way to know whether `muscleEquipmentStroke: '#7C574A'` is right, because nothing draws it — and the "every palette defines every field" test makes inventing them compulsory |
| "Hand-drawn media would want them back"   | It would want its own values. These were tuned against artwork that no longer exists, so new artwork would re-pick them anyway. What was actually being preserved was seven names, and re-adding seven names is additive and takes a minute                                        |

**Notes for the next session**

- **This is stacked on `feat/exercise-media-pipeline` and is deliberately its own branch.**
  The fields are only dead because of that branch, so it has to merge first — but the removal
  is a judgement call rather than a defect, so it is kept separable in case Omar wants M3
  without it.
- **Nothing else in the app changed.** No component read these, no CSS referenced them, and
  the four screens render identically. 449 tests, unchanged in number: the two muscle
  assertions were substituted rather than dropped.
- If SVG or hand-drawn media ever returns, add the fields it needs back to
  `ColorPaletteDefinition` and give each palette a value chosen against the actual artwork.
  The contract's shape does not need redesigning for that; it is an additive change.

---

### Session 8 - 2026-08-31 - M4 Firebase setup and the auth foundation

**Agent:** Claude (Opus 5)
**Branch:** `feat/firebase-data-layer`, branched off `main`

Omar worked through [SETUP_FIREBASE.md](SETUP_FIREBASE.md) himself and came back with two
steps he could not complete. Both turned out to be defects in the document rather than
mistakes he made.

**The two setup problems, and what they actually were**

| What he hit                                                                      | What was actually wrong                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 5 told him to deploy `firestore.rules`. There was no such file              | **It had never been written.** Session 1's own notes say it arrives in M4. The document was written ahead of the file and then read as though the file existed. `firestore.rules`, `firebase.json` and `.firebaserc` are now committed, and the rules are deployed                                                              |
| Step 6 told him to delete every domain except two. The console would not let him | **The instruction was wrong.** `second-body-osi.firebaseapp.com` is the `authDomain` in the config and hosts the OAuth redirect handler, so deleting it breaks Google Sign-In — which is why the console hides the delete icon. Neither it nor `.web.app` is a hole: both are Google-controlled hosts belonging to this project |

**Verified rather than asked about.** The project (`second-body-osi`, project number
917535912250), the Firestore database (native mode, `me-central1`) and the full
authorised-domain list were all confirmed from the CLI and the Identity Toolkit endpoint
before asking Omar anything. Only Google Sign-In genuinely has no CLI or API equivalent, so
that was the one question worth his time.

**Done**

- `firestore.rules` — the ruleset from [DATA_MODEL.md](DATA_MODEL.md#4-security-rules)
  verbatim. Deployed, compiled and released to `cloud.firestore`.
- `firebase.json` points the deploy at it. `.firebaserc` pins the project id, which removes
  the interactive `firebase use --add` from step 5 entirely. **No `hosting` block on purpose**
  — deploying to Firebase Hosting is what would make `.web.app` meaningful, and this app
  deploys to GitHub Pages.
- `SETUP_FIREBASE.md` steps 5 and 6 rewritten. Step 6 now says the finished list has **four**
  entries and explains why the last two cannot and should not be removed.
- `firebaseApp.ts` — one app, `getAuth`, and Firestore with `persistentLocalCache`. The
  `getApps()` guard is not defensive padding: Vite re-executes the module on hot reload, and
  both `initializeApp` and `initializeFirestore` throw on a second call.
- `googleAuthenticationService.ts` — popup sign-in, falling back to redirect. The fallback
  rule lives in `popupSignInFallback.ts` so it can be tested without booting Firebase.
- `userDocumentRepository.ts` — `ensureUserDocumentExists`. Reads before writing so
  `createdAt` is only ever set once; a blind merge would reset "training since" on every
  launch.
- `AuthenticationProvider` / `authenticationContext` / `useAuthentication`, split three ways
  for the same Fast Refresh reason as the palette trio.
- `AuthenticationGate` as a layout route, so screens behind it can assume a signed-in user.
- `SignInScreen`, and an account panel in Settings with sign-out.
- Three `signInWelcome` coach lines in `src/content/coachVoice/authenticationCoachLines.ts`.
- 474 tests, up from 449. Full `npm run verify` green. Sign-in screen rendered and checked at
  375x812 with no console errors and no horizontal overflow.

**Decisions made and why**

| Decision                                                  | Reason                                                                                                                                                                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthenticationStatus` has three states, not two          | Firebase restores a session asynchronously. Collapsing the unknown moment into `signedOut` flashes the sign-in screen at an already-signed-in user on every refresh                                                                               |
| A closed popup does **not** trigger the redirect fallback | `auth/popup-blocked` means the browser refused, and a redirect is the only way through. `auth/popup-closed-by-user` means he changed his mind — redirecting him to Google anyway is the app arguing with him                                      |
| The Google "G" carries hard-coded hexes                   | A brand mark that recoloured with the palette stops being the brand mark. Same category as the neutral highlight and shadow overlays, so it is now written into DESIGN_SYSTEM.md as a third allowed exception rather than left as a silent breach |
| A failed user-document write does not block sign-in       | Auth worked; the write is what failed, which in practice means the rules are not deployed. The message says so, and the user is let through rather than bounced off a screen they already dealt with                                              |
| The dev-only media review screen sits outside the gate    | It renders content from `src/content/` and touches nothing personal. Signing in to look at a sheet of animations is friction for no gain                                                                                                          |
| `App.test.tsx` mocks the two service modules              | CLAUDE.md section 5 says not to test Firebase. Mocking them also means `firebaseApp.ts` is never imported in tests, so no app is initialised and no IndexedDB cache is opened in jsdom                                                            |

**Notes for the next session**

- **This is a checkpoint, not a finished milestone.** M4 still needs the typed repositories
  for the other seven collections and the onboarding flow that writes `profile/current`.
- **Do not re-ask for the Firebase setup.** All of it is done and verified. If something looks
  wrong, `firebase firestore:databases:list` and the Identity Toolkit `projects` endpoint will
  report the live state without needing Omar.
- The sign-in screen fixes verbosity at `standard` and the rotation index at `0`, because
  settings live in Firestore and there is nobody to load them for yet. Once M8 has a settings
  repository, that screen can read the real value.
- `ensureUserDocumentExists` costs one read and one write per sign-in. That is deliberate and
  documented in [DATA_MODEL.md](DATA_MODEL.md#6-cost) — it is not worth optimising.

---

### Session 9 - 2026-08-31 - M4 repositories and onboarding

**Agent:** Claude (Opus 5)
**Branch:** `feat/firebase-data-layer`, continuing from the session 8 checkpoint

Omar signed in, confirmed `users/{uid}` appeared, and asked for the rest of the milestone.
This is the second half: the seven typed repositories and the onboarding flow.

**Done**

- **Persisted types**, in three files grouped by concern rather than one per collection:
  `userAccountTypes.ts`, `trainingHistoryTypes.ts`, `dailyTrackingTypes.ts`.
- **`firestoreDocumentReading.ts`** — the shared reader every mapping is built on. Firestore
  hands back `DocumentData`, and casting that to `UserProfile` would make the type system
  lie about fields that may not be there. Every field is read through a check that either
  produces the right type or throws naming the document and the field.
- **Three mapping files** (`userAccount`, `trainingHistory`, `dailyTracking`), holding all
  the translation logic and every decision in it. **65 tests.**
- **Seven repositories**, each thin enough to have nothing worth testing:
  `userProfile`, `userSettings`, `programAssignment`, `workoutSession`, `bodyMetrics`,
  `dailyHabits`, `personalRecords`. Plus `userCollectionPaths.ts`, which is the only place a
  collection name is spelled.
- **`src/domain/onboardingValidation.ts`** + 21 tests. Takes the current year as an argument,
  because `src/domain/` may not read a clock.
- **`OnboardingFlow`** — five steps, with `OnboardingNumberField` and `OnboardingChoiceGrid`.
- **`UserProfileProvider` / `OnboardingGate`**, nested inside the M4 authentication gate.
- `PendingScreen` extracted from `AuthenticationGate`, now shared by both gates.
- Six `onboardingOpening` / `onboardingFinished` coach lines.
- Docs: `DATA_MODEL.md` records both deviations from its own sketch; new READMEs for
  `services/repositories/` and `features/onboarding/`.
- **570 tests, up from 474.** `npm run verify` green, production build clean.

**Decisions made and why**

| Decision                                                                      | Reason                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App types use `Date`, never Firestore's `Timestamp`                           | `src/domain/` reads these types and must not know Firebase exists. Converting is the repositories' job, and it is precisely the translation logic CLAUDE.md section 5 wants tested with fakes                                                                                                            |
| A timestamp is recognised by having `toDate()`, not by `instanceof Timestamp` | Keeps the entire mapping layer free of a Firebase import, so it is unit testable without initialising an app — the same trick as `popupSignInFallback.ts` in session 8                                                                                                                                   |
| Statuses strict, vocabulary lists lenient, preferences most lenient           | Three different failure meanings. A session status of `paused` is a bug worth hearing about. A renamed equipment id should not lock Omar out of his app. A renamed preference option should not brick a release until every document is migrated                                                         |
| Optional numbers are null, never defaulted to zero                            | An unmeasured waist and a 0 cm waist are different facts, and the charts average these. A defaulted zero drags a trend line down while looking exactly like data                                                                                                                                         |
| `PerformedSet` weights are nullable, departing from DATA_MODEL.md             | A dead bug has no weight. `PerformedSetRecord` has said so since M2. The doc was updated to match the code rather than the other way round                                                                                                                                                               |
| Every query is single-field                                                   | Firestore indexes those automatically; a composite index must be declared and deployed, and `firebase.json` ships rules only. No screen needed one                                                                                                                                                       |
| The profile is watched with `onSnapshot`, not fetched                         | Started as a fix for `react-hooks/set-state-in-effect`, which wants setState in a subscription callback rather than after an effect's fetch. It turned out to be the better design anyway: the local cache makes the first callback instant, and onboarding's write re-fires it with no explicit refetch |
| Profile state is tagged with the user id it belongs to                        | Without it there is a render where the new user's id is in context and the previous user's profile is still in state. Tagging means anything belonging to someone else simply does not count as loaded                                                                                                   |
| A failed profile read is its own state, not "no profile"                      | Otherwise a dropped connection walks someone who onboarded months ago back into being asked their height. `merge` means nothing would be lost, but being asked is its own kind of broken                                                                                                                 |
| The equipment step starts fully ticked                                        | The inventory was counted in Omar's gym in person in session 4, so "all of it" is the right answer for him. Unticking beats ticking twenty-six boxes                                                                                                                                                     |

**Notes for the next session**

- **The onboarding screens have not been seen by a human.** Their behaviour is covered by
  tests, but signing in needs Omar's Google account, which an agent cannot and should not do.
  He will meet the flow on his next load, because `profile/current` does not exist yet.
- `writeUserSettings` takes a partial and spreads it directly rather than routing through the
  mapping. That is safe **only** because every preference is a primitive whose stored name
  matches its type name. If a settings field ever needs converting, that shortcut has to go —
  the comment on it says so.
- `excludedExerciseIds` is written as an empty array and has no onboarding question. It is
  for something a physio ruled out, which is a conversation rather than a checkbox.
- The bundle is 940 kB before gzip and Vite warns about it. Firebase is most of that. Worth a
  dynamic import in M9 rather than now.
- Nothing reads `bodyMetrics`, `dailyHabits`, `personalRecords` or `programAssignments` yet.
  They are written and tested ahead of the screens that use them in M6 to M8, which is why
  they exist with no caller.

### Session 10 - 2026-08-31 - M5 the active session

**Agent:** Claude (Opus 5)
**Branch:** `feat/active-session`, branched off `main`

The session player. The screen the previous four milestones were building towards, and the
first one that reads the training content, the progression rules and Firestore all at once.

**Done**

- **`src/domain/activeSessionMachine.ts`** — the explicit machine
  [ARCHITECTURE.md](ARCHITECTURE.md#6-state-management) asks for, pure and with 35 tests. It
  also owns the two behaviours that are easy to get wrong: a set logged with sharp pain ends
  that exercise for the day rather than offering another set of it, and
  `resumeActiveSessionState` rebuilds where to pick up from what was stored.
- **`restTimer.ts`** — rest arithmetic that survives the phone sleeping through the whole
  rest, and that keeps counting past the target rather than stopping at zero.
- **`sessionLogging.ts`** — the draft a set starts from, and the document it ends as.
- **`exercisePerformanceHistory.ts`** — reading stored sessions back into what progression
  wants. This is the piece that makes double progression actually fire.
- **`programAssignmentProgress.ts`** — starting a programme, moving the week on after session
  C, and restarting the phase after ten days away.
- **The feature**: a Zustand store as the impure shell, and eight panels. Warm-up with the
  right dose for the time of day; an exercise brief with the animation, the cues and what goes
  wrong; the weight at twice display size; a set logged in one tap when it went as prescribed;
  a rest timer with a ring and two synthesised notes; a review; a summary.
- **`useScreenWakeLock`** — one of the extras in the locked decisions table. It re-acquires
  the lock every time the page becomes visible, because the browser drops it whenever the page
  is hidden.
- **The route**, registered outside `AppShell` and inside both gates, exactly where M1 left a
  comment asking for it. `TodayScreen` gained a card linking to it.
- **`excludedExerciseIds` now reaches the planner.** It was written by M4 and read by nothing.
- **689 tests, all green**, of which 129 are new.

**Decisions made and why**

| Decision                                                     | Reason                                                                                                                                                                                                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No Firestore **write** is ever awaited                       | A write made offline does not resolve until the device reconnects. Awaiting one would freeze the screen in a dead spot, which is exactly where this app is used. Reads are awaited: those resolve from the local cache                          |
| Every save writes the session document whole                 | Which is what makes the above safe — only the most recent write has to land, so one that never went out costs nothing. It is also what M4's repository already did, for the same reason                                                         |
| Three machine states renamed from the ARCHITECTURE.md sketch | `setActive` and `setLogging` read as adjectives rather than as states, and `cooldown` described a stretch that the step is not — it asks how the session felt. The diagram in that document was updated to match                                |
| Sharp pain ends the exercise, not just the set               | The coach line written in M2 says "stop that exercise for today", and the app should do what the coach says. The 20% reduction next session is separate and already existed                                                                     |
| A carry is counted in metres and cardio in minutes           | `PerformedSet` has exactly one count field and four kinds of prescription. Rather than pretend a farmer's carry has reps, `resolveSetCountUnit` names the unit and the control is labelled with it. Nothing compares metres against a rep range |
| The session is prepared once, when the screen opens          | `userProfile` comes from a Firestore subscription and arrives again when the server corrects the cache. Re-planning on that would throw away everything logged so far, mid-workout                                                              |
| The rest timer never advances the session by itself          | Ninety seconds is a prescription, not a starting pistol. It counts past the target, shows the overrun, and waits for a tap                                                                                                                      |
| Only completed sessions count as progression history         | An abandoned session may hold one set of an exercise that was prescribed two, and "every set reached the top of the range" would then be true of a session he walked out of                                                                     |
| A skipped exercise does not erase the history behind it      | The machine being busy last Wednesday is not a reason to prescribe a calibration weight today, so the search keeps going back                                                                                                                   |
| The warm-up ticks are not stored anywhere                    | The warm-up is not logged — `WorkoutSession` records working sets. The ticks exist so he can keep his place in a list of eight things, and they vanish with the screen                                                                          |
| Finishing early ends the session properly                    | Four exercises out of six is a session, not a failure, and the alternative is walking out with nothing recorded                                                                                                                                 |
| `describeRepositoryError` is new, beside the auth one        | `describeAuthenticationError`'s fallback says "sign-in did not go through", which is the wrong thing to read after a set fails to save. Same codes, different subject                                                                           |
| The chime is synthesised, not a file                         | Two sine tones. An audio asset would be 30 kB of download and a licence to think about                                                                                                                                                          |
| Equipment filtering deliberately left out                    | Dropping an exercise because the gym lacks the machine leaves a hole in the session. It wants the substitution feature on the roadmap first, and that is a bigger decision than a filter                                                        |

**Notes for the next session**

- **Nobody has walked a real session yet.** Every panel was rendered and read back against the
  real programme content, and every rule has a test, but logging a real set on a real phone
  needs Omar's Google account. That is the check that matters and it is his to make.
- **The panels were verified through a throwaway preview page**, not through the app, for the
  same reason: the session screen sits behind the auth gate. A `session-preview.html` plus a
  `sessionPreviewEntry.tsx` rendered each panel with fixture props; both were deleted before
  committing. If you need to look at a gated screen again, that is the trick.
- **Seven things looked wrong once they were on a phone-sized screen** and were fixed in the
  third commit. Worth reading that commit before adding a panel of your own — the mistakes
  were all of one kind: a value rendered correctly and labelled carelessly.
- **The browser pane still times out on clicks**, as it did in sessions 2, 5 and 6. Driving
  the page with `javascript_tool` worked every time. Not an app problem.
- `settings.defaultRestSeconds` is still unread. Every exercise slot carries its own
  `restSecondsBetweenSets`, which is more specific, so the setting has nothing to fall back
  from. It becomes meaningful if a slot ever omits its own rest.
- `PerformedSet.skipReason` is stored and read but never written with anything but null.
  Nothing asks why an exercise was skipped yet.
- The bundle is now 1,038 kB before gzip, up from 940. The dynamic import of Firebase in M9
  matters slightly more than it did.

### Session 11 - 2026-08-31 - M6 the dashboard and the schedule

**Agent:** Claude (Opus 5)
**Branch:** `feat/dashboard-and-schedule`, branched off `main`

The two screens that tell him what to do when he is not already doing it. M5 built the
session player and left a placeholder on Today that linked to it without knowing whether a
session was due; this replaces that, and fills in the Schedule tab beside it.

**Done**

- **`src/domain/calendarDates.ts`** — calendar days as distinct from instants. Every function
  moves whole days rather than adding 24 hours, which is not the same operation on the two
  nights a year the clocks change. It also fixes `findNextTrainingDate`, an M2 function whose
  24-hour arithmetic could return today from just after midnight on the night the clocks go
  back. M6 is its first caller, so the bug had never had a chance to happen.
- **`src/domain/dailyTrainingStatus.ts`** — the six stances the Today screen takes, and the
  distinction the whole screen rests on: the 48 hours are a **rail**, the training days are a
  **plan**. Only the first can stop a session starting.
- **`src/domain/trainingCalendar.ts`** — the grid, including the letter projection. The A, B,
  C cycle moves on completion rather than on a weekday, so a missed Wednesday means Friday
  trains what Wednesday would have.
- **`src/domain/programProgressSummary.ts`** — week N of 12, phase, and a completion fraction
  measured in sessions rather than weeks.
- **`src/domain/dailyCoachMoment.ts`** — which of six situations is the one worth a word
  today, ranked, or none.
- **`src/hooks/useTrainingOverview.ts`** — the reads both screens share, so they cannot
  disagree about what week it is. It writes nothing, deliberately.
- **The Today screen**: a stance-driven session panel that lists the movements the session
  contains, the coach's line for the day when there is one, a rest-day note naming Desk Undo,
  and an M8 placeholder for habits and the scale.
- **The Schedule screen**: programme progress with the three phases, a five-week calendar
  grid, the next three sessions, and the 48-hour rail stated in full.
- **`isExerciseSlotAvailable` exported from `sessionPlanning.ts`**, so the movements Today
  lists are the movements the session holds — one rule, one implementation, and a test that
  compares the two lists against the real programme.
- **811 tests, up from 777**, of which 34 are new. `npm run verify` green, production build
  clean.

**Decisions made and why**

| Decision                                                       | Reason                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The training days never block a session; only the 48 hours do  | Monday/Wednesday/Friday is a plan. A Wednesday missed for a late meeting is trained on Thursday, and the `sessionMissed` line written in M2 says exactly that. A rest day offers "train it today instead" rather than nothing                                    |
| Today shows movements and never weights                        | Every number is prescribed when the session opens, against history read at that moment. A weight on the dashboard would be a second opinion, and two opinions about what goes on the bar is one too many                                                         |
| Six stances rather than one card with a different verb         | "You trained today", "clear in 11 hours" and "nothing scheduled" are three different things to read and three different things to offer. A union means adding a seventh makes the compiler ask for its words rather than rendering an empty card                 |
| `trainedToday` is checked before `recovering`                  | Both are true on a Monday evening after a Monday afternoon session. "You have already done this today" is a far better thing to read than "36 hours to go"                                                                                                       |
| Display counts calendar days; the layoff rule counts 24 hours  | Trained at 19:00 last night and read at 18:30 tonight is _yesterday_. Counting elapsed periods called it "today" next to a countdown saying 25 hours — caught on screen, not in a test. The layoff rule keeps elapsed time: a body does not know what day it is  |
| A missed day never gets a projected letter                     | We know a session did not happen. We do not know which one it would have been, because the cycle had not moved on, and a guess would be contradicted by the next day along                                                                                       |
| Nothing before the programme started can be missed             | Otherwise a new account opens the Schedule screen to a wall of failures it had no way to avoid                                                                                                                                                                   |
| The hook creates no assignment and writes no layoff restart    | Both would otherwise happen because somebody opened the app. Starting the programme is the session player's job, at the moment a session actually starts — a dashboard that created one would date the programme from the day he first looked at it              |
| The session panel is `elevated`, not `accent`                  | `accent` is a solid brand gradient, reserved by DESIGN_SYSTEM.md for "primary buttons, the active set". Secondary text on it is fine for three words and not fine for six movement names. Caught on screen; the emphasis now comes from the badge and the button |
| Calendar days are told apart by shape as well as colour        | The whole content of that screen is the difference between done, planned and missed. Colour alone would leave it unreadable to anyone who cannot separate the palette's green from its amber                                                                     |
| One `new Date()` per screen, passed down                       | "Tomorrow", "in 11 hours" and "today" all have to agree. Three components each reading the clock is how one of them ends up a day out at one minute to midnight. `useCurrentTime` stays for the rest timer, where the seconds are the point                      |
| The recovery panel appears even when nothing is blocked        | "You are clear" is as much a fact as "eleven hours to go", and a panel that only appeared when something was blocked would make the rail feel like a punishment                                                                                                  |
| `useTrainingOverview` tags its state with the user it read for | The same trick `UserProfileProvider` uses, for the same reason, and it also removes the synchronous `setState` in an effect that `react-hooks/set-state-in-effect` rejects                                                                                       |
| The full rest-day offer was left on the roadmap                | "Rest-day suggestions" is parked there with the step target it belongs beside. The note naming Desk Undo is the half that stops a rest day being an empty screen, and it costs nothing to replace                                                                |

**Notes for the next session**

- **Still nobody has walked a real session.** Unchanged since M5, and still the check that
  matters most.
- **Both screens were verified through a throwaway preview page**, the trick session 10
  recorded: `m6-preview.html` plus `src/m6PreviewEntry.tsx` rendered every panel across all
  six stances with fixture props, and both were deleted before committing. Two real problems
  came out of it that no test would have found — the contrast one and the "today"/"yesterday"
  one, both in the decisions table above.
- **The palette switcher was checked against the new panels.** Switching to `amberCrimson`
  recolours the calendar, the progress bar and every badge. No hard-coded colour was added.
- `readInProgressWorkoutSession` has a second caller's worth of work done without it:
  `useTrainingOverview` derives `hasSessionInProgress` from the sessions it already read,
  because the screens only need to know _whether_ there is one. If a screen ever needs to
  know _which_, use the repository rather than widening this.
- The Schedule screen names upcoming sessions from the phase the **current** week is in. A
  projection that ran past a phase boundary would name the session it will be called then
  rather than now. The names only change at a boundary, so the error is small, rare and
  self-correcting — but it is an error, and it is commented where it happens.
- The calendar reads the last 40 sessions, the same window the session player uses. Five
  weeks of grid needs far less; the number is a bound, not a page size.
- The bundle is 1,068 kB before gzip, up from 1,038. The dynamic import of Firebase in M9
  keeps getting slightly more worthwhile.

### Session 12 - 2026-08-31 - M7 progress tracking

**Agent:** Claude (Opus 5)
**Branch:** `feat/progress-tracking`, branched off `main`

The Progress tab, which had been a `ComingSoonPanel` since M1. Three panels and a control:
the scale as a rolling average, work done by week, the best each lift has been, and the
first way to actually log a weight.

**Done**

- **`src/domain/bodyWeightTrend.ts`** — the seven-day rolling average, the weekly rate, and a
  verdict against the expected range from `bodyWeightExpectations`. The window is measured
  **in days, not in readings**, so a lazy fortnight does not quietly stretch the average back
  a month and draw a smoother line than the data behind it. Two weigh-ins on one day are
  averaged rather than one being picked. `tooEarlyToTell` is a real verdict: weeks 1 to 3 are
  exempt from judgement however much data there is.
- **`src/domain/trainingVolumeTrend.ts`** — sessions bucketed into weeks, **including the
  empty ones**. A fortnight off is the most important thing a volume chart can show, and
  dropping the blank columns would redraw a layoff as an unbroken climb. The week-on-week
  ratio is separately nullable: coming back after a week off is not an infinite improvement.
- **`src/domain/personalRecordProgress.ts`** — which lifts in a finished session were the best
  they have ever been, compared on estimated one-rep max so two extra reps at the same weight
  counts. Two exclusions, both deliberate: only weight-and-reps movements are eligible (a
  carry stores metres in `actualReps` and Epley on that is a confident, meaningless number),
  and **a set that caused sharp pain never becomes a record** — it happened, it is on the
  session, and it is not a target to beat next month.
- **`parseIsoDate` and `countWholeWeeksSince`** added to `calendarDates`. The first is the
  inverse of `formatIsoDate` and exists because `new Date('2026-04-09')` parses as midnight
  UTC, which is the previous evening anywhere west of Greenwich.
- **Two chart primitives in `src/components/`** — `TrendLineChart` (SVG, fixed viewBox so a dot
  stays a circle) and `ColumnChart` (elements, so it reflows). Both are feature-agnostic:
  they know about numbers and labels, never about kilograms or weeks.
- **The Progress screen**, its four panels, `progressWording.ts`, `progressCoachLines.ts`,
  `personalRecordPresentation.ts` and `useProgressHistory`. 82 new tests across the milestone,
  bringing the suite to 893.
- **Personal records are now written.** `recordPersonalRecordsFromFinishedSession` in
  `useActiveSessionStore` runs once at the end of a session. `personalRecordsRepository` had
  been sitting there unread since M4.
- **A weight can be logged**, from the Progress screen. `addBodyMetricEntry`'s first caller.

**Decisions made and why**

| Decision                                                      | Reason                                                                                                                                                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weight logging lands in M7, not M8                            | M7 draws a weight trend. A trend with no way to add a reading is a chart of an empty collection. The _quick_ log on Today is still M8's                                      |
| `useProgressHistory` is separate from `useTrainingOverview`   | Today and Schedule open on every launch and neither shows a weigh-in. Two more Firestore reads on cold start so a third screen could avoid a hook is the wrong trade         |
| Runtime sentences live in `progressWording`, not `coachVoice` | Every one of them contains a number that only exists at runtime, so none could be written in advance. They still follow the voice's rules                                    |
| Losing weight faster than planned is reported as a risk       | It is not good news on a beginner programme — muscle goes with the fat. The domain returns `aheadOfExpectation` as a neutral fact and the wording refuses to congratulate it |
| Eligible-for-a-record is resolved by the caller               | Whether a movement is weight-and-reps is a fact about the prescription, and `src/domain/` may not read `src/content/`. Same shape as `resolveLoadingStyleForExercise`        |
| A failed record write shows an accurate message               | "Your session is saved, your records will catch up" — because that is what happened. Reusing the generic save error would have said something false about the session        |
| The column chart has a baseline, not a track                  | Found by looking at it: a filled track reads as a full column, so three empty weeks looked like the three best weeks of the block                                            |

**Notes for the next session**

- **Still nobody has walked a real session.** Unchanged since M5, and still the check that
  matters most. Nothing in M7 changes that, and M7 is the milestone with the most to gain
  from it — every number on the screen is currently drawn from fixtures.
- **The panels were verified through a throwaway preview**, the trick sessions 10 and 11
  recorded: `src/ScratchProgressPreview.tsx` plus a one-line swap in `main.tsx` rendered all
  four panels with fixture data, and both were reverted before committing. Two real problems
  came out of it that no test would have found, both in the decisions table: the column track
  reading as data, and the week labels showing "16" twice across a three-month window.
- **Personal records only start accumulating from the next session onwards.** Nothing
  backfills them from existing sessions, and nothing should — the collection is keyed by
  exercise and a backfill would have to invent `achievedInSessionId` for records set before
  the code existed. There are no completed sessions yet, so nothing is actually lost.
- If a session's document id is still in flight when the session finishes, records are
  skipped for that session rather than stored against an id that does not exist. Commented
  where it happens. It needs the network to die between the first set and the last.
- `useActiveSessionStore` has a private `formatLocalIsoDate` that duplicates
  `calendarDates.formatIsoDate` exactly. It predates M6 and was left alone rather than
  widening this milestone's diff. Worth one line of cleanup in M8.
- The bundle is 1,090 kB before gzip, up from 1,068. Still no dependency added — the charts
  are hand-drawn SVG and flexbox rather than a charting library, which was the point.

---

### Session 13 - 2026-08-31 - M8 habits and settings

**Agent:** Claude (Opus 5)
**Branch:** `feat/habits-and-settings`, branched off `main`

The last two unbuilt surfaces: the daily checklist on Today, and a settings screen that can
actually change something. Both had their data layer waiting for them since M4 — this is the
milestone that gave `dailyHabits` and `settings/current` a caller.

**Done**

- **`src/domain/habitCompliance.ts`** — what was met, the run of good days, and how the last
  stretch went. Three decisions in it are load-bearing:
  - **A day is judged against the target that was in force on that day.** `HabitDay` carries
    its own step target rather than the summariser applying today's. The target climbs from
    5,000 to 9,000 across the twelve weeks, so judging history against the current one would
    turn a run of good days into a run of failures every time the ramp stepped up.
  - **Today counts when it is good and is skipped when it is not.** Only a bad _yesterday_
    breaks a streak. At nine in the morning nothing has been ticked and the day has not gone
    wrong — it has not happened.
  - **`buildRecentHabitDays` returns calendar days, not recorded days**, filling the gaps
    with blanks. Dropping the untouched days would report a bad fortnight with three good
    days in it as "3 of the last 3 days", which is an app being on your side rather than
    telling you the truth. It stops at the programme start date, so day three does not
    report a week that mostly predates the app.
- **`src/domain/profileEditing.ts`** — which of the eight profile fields may be changed after
  onboarding, and what a valid change is. Five can; the three that cannot each have a reason
  written next to them, the important one being that `startingWeightKilograms` is the
  baseline every past weigh-in is measured from.
- **`onboardingValidation.ts` grew three exported predicates** and lost nothing.
  `isPlausibleHeightCentimetres`, `isPlausibleBodyWeightKilograms` and
  `findTrainingDayProblems` are now shared with profile editing rather than restated there. A
  height the onboarding form accepts and the settings form rejects is the sort of
  disagreement nobody finds until it happens to them.
- **The habit checklist on Today** — three ticks and two numbers, the week's step target, the
  streak, the last seven days, one of Harout's habit lines, and a single "Why these five"
  disclosure carrying the `whyItMatters` copy that had been sitting unread in content since
  M2. Ticks save optimistically and roll back on failure; typed numbers get a confirm button,
  because an 8 on the way to 8,200 must never be recorded as eight steps.
- **The quick weigh-in on Today** — folded shut to one line until it is asked for, and folded
  shut again once a reading lands. Deliberately not the same component as
  `LogBodyWeightPanel` on Progress: that one sits under the trend it moves and explains how
  to weigh yourself consistently, this one is a two-tap job on the way past the bathroom.
- **The settings screen, finished.** Coach verbosity, the rest timer sound and the wake lock
  are now editable and all three change behaviour immediately. Profile editing writes through
  `applyProfileEdits`. The palette is stored against the account.
- **`useStoredColorPaletteSync`** in `src/hooks/`, called from `AppShell`. localStorage is now
  explicitly the cache — the only one of the two that can be read synchronously during the
  first render — and `settings/current` is the source of truth. M1 left a note asking for
  this and said M4 would do it.
- **Three components promoted to `src/components/`**: `ChoiceChipGrid` and `NumberField` out
  of `features/onboarding/` (Settings asks three of the same questions, and features may not
  import from each other), plus a new `ToggleSwitch`. `src/content/vocabulary/` was added for
  the same reason: pain-area and day-of-week labels were about to exist twice.
- **`ComingSoonPanel` deleted.** M8 was the milestone it was supposed to die in.
- **The `formatLocalIsoDate` duplicate in `useActiveSessionStore` is gone**, replaced by
  `calendarDates.formatIsoDate`. Session 12 left this as a one-line cleanup for M8.
- **966 tests, up from 893.** 73 new, of which 45 are domain. `npm run verify` green.

**Decisions made and why**

| Decision                                                  | Reason                                                                                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The checklist lives on Today, not on a fifth tab          | It is answered in passing, in the evening, on the way past. A habit that needs navigating to is a habit that gets skipped. The bottom navigation is still four items                  |
| A "good day" is three of five, not five of five           | A streak that breaks the first time somebody sleeps badly is a streak nobody keeps for a fortnight. Most days is enough — TRAINING_PROGRAM section 9                                  |
| An untouched day reads as untouched, never as "0 of 5"    | The three ticks default to `false` in storage, so a day nobody opened is indistinguishable from a day where nothing went right. `hasAnythingRecorded` is what separates them          |
| No praise lines were added for habit streaks              | `allCoachLines.test.ts` allows praise in exactly two categories, and habits are not one. A daily surface that congratulates you daily stops meaning anything. The streak is a fact    |
| `useTodayTracking` is separate from `useTrainingOverview` | The Schedule screen shows neither habits nor the scale. Folding them into the shared hook would make every screen pay for two more reads on cold start                                |
| Ticks are optimistic; typed numbers are not               | A checkbox that waits for a round trip gets pressed twice. A number field that saved on every keystroke would record an 8 on the way to 8,200                                         |
| `defaultRestSeconds` and `weightUnit` get no controls     | Nothing reads the first and nothing renders the second. A switch that changes nothing is worse than no switch. Both are noted in the settings README rather than silently skipped     |
| Starting weight is not editable                           | It is the baseline the whole weight trend is measured from. Editing it would silently rewrite what every past weigh-in meant. A new starting point is a new programme                 |
| The two weight-log panels are not one shared component    | They answer different questions on different screens. Sharing would mean one of them carrying the other's chrome, and the rule against cross-feature imports is not the reason        |
| Panels remount rather than copying props into state       | The numeric habit rows and the weigh-in panel both reset from the outside. Keying them is honest; an effect that watches a prop and calls `setState` ends up one render behind        |
| 30 days of habit history is read on launch                | Enough for the seven-day figure with room to spare. It also bounds the streak, which is a documented ceiling rather than a silent one. Thirty small documents is inside the cost note |

**Notes for the next session**

- **Still nobody has walked a real session.** Unchanged since M5. M8 is the milestone where
  it would find the most, because the checklist is the one surface touched every single day
  and it has only ever been exercised against fixtures.
- **The panels were eyeballed through the usual throwaway preview** — `src/ScratchM8Preview.tsx`
  plus a one-line swap in `main.tsx`, rendering both checklist states, both weigh-in states
  and both settings panels with fixture data at 375 px. Both were reverted before committing.
  Nothing needed fixing this time; the one thing that looked wrong — the numeric rows
  appearing wider than the tick rows — measured identical, and is the met-row tint reading as
  extra width. Everything past the sign-in gate still needs Omar's Google account.
- **`buildRecentHabitDays` takes a callback** to resolve each day's step target. That keeps
  the ramp in `habitTargets.ts` and keeps the function about _which days_ — but it is the
  only function in `src/domain/` that takes one apart from `resolveSessionPlan`, so it is
  worth knowing it is deliberate rather than accidental.
- **A second device editing the profile mid-edit will not update the open form.** The
  profile is watched, so the new values arrive in context, but the form holds a draft and
  keeps it. Blowing away half-typed edits because another device wrote something would be
  worse. Worth remembering before anyone calls it a bug.
- **The streak cannot exceed 30 days** because that is the window read. It is commented where
  it happens. If he ever gets there it is a pleasant problem and one number to change.
- The bundle is 1,116 kB before gzip, up from 1,090. No dependency was added; that is two
  screens' worth of new components and copy.

---

---

## Locked decisions

Settled with Omar during the M0 interview. Do not silently revisit these — if one needs to
change, raise it with him.

| Area           | Decision                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frequency      | 3 days per week, Monday / Wednesday / Friday, 45-60 minutes                                                                                      |
| Time of day    | Varies. Warm-up length adapts to session start time                                                                                              |
| Medical        | Physio-cleared, no structural findings, no movement restrictions                                                                                 |
| Pain areas     | Neck and upper traps, lower back, shoulders, knees / hips / ankles                                                                               |
| Experience     | Effectively a beginner. Full form cues on every set                                                                                              |
| Cardio         | Incline treadmill walking and stationary bike. Rowing machine deferred to Phase 3                                                                |
| Nutrition      | Four daily habit checkboxes. No calorie or macro logging                                                                                         |
| Home equipment | Mat, resistance bands, foam roller                                                                                                               |
| Gym equipment  | Counted in person, session 4. It is `src/content/equipment/gymEquipment.ts`. No leg press, no hip thrust machine, no landmine, no confirmed rack |
| Goal           | Body recomposition to ~82-84 kg with more muscle. **Not** weight loss alone                                                                      |
| Visuals        | 180×180 GIFs matched from an open dataset, inverted for the dark theme. **Changed by Omar in session 6**; codex-generated SVG was tried first    |
| Repository     | `second-body`, public. No personal data committed, ever                                                                                          |
| Git workflow   | Claude commits locally on feature branches. **Omar pushes and opens all pull requests**                                                          |
| Backend        | New Firebase project, Google Sign-In, Firestore locked to one uid                                                                                |
| Offline        | Not supported. Firestore's local cache covers brief dropouts only                                                                                |
| Extras         | Home-screen install manifest, screen wake lock during sessions                                                                                   |
| Tracking       | Bathroom scale. Waist and other measurement fields exist but are optional                                                                        |
| Theme          | Dark only. Mobile only. Purple-blue palette by default                                                                                           |

## Standing notes about Omar

- He reviews every pull request by reading it. Favour long explicit names and clear
  structure over cleverness.
- He responds well to genuine feedback but not to a constant stream of praise. Ration it.
- He was advised once to get a sleep apnea screen, given snoring plus low energy plus recent
  weight gain around the neck and chest. **Mentioned once. Do not bring it up again.**
- A tape measure was recommended and declined for now. The fields exist for when he changes
  his mind. Do not nag about this either.

---

### Session 14 - 2026-08-31 - M9 deployment

**Agent:** Claude (Opus 5)
**Branch:** `feat/pages-deployment`, branched off `main`

The milestone that puts it on a phone. Three parts: a deploy workflow, an icon and a web
manifest — plus one change Omar asked for that was not on the original M9 list, and which
turned out to be the most interesting part of it.

**Done**

- **`.github/workflows/deploy.yml`** — three jobs, `build` -> `deploy-firestore-rules` ->
  `deploy-pages`, each depending on the one before. Nothing deploys until formatting,
  type-check, lint, 978 tests, the media verifier, the icon verifier and the build have all
  passed.
- **The security rules now deploy from CI, in the same run as the app.** This is the change
  Omar asked for, and the reason is his: on a previous project the rules were deployed by
  hand, drifted from what was live, and the mismatch was only found by hitting it. Three
  decisions make the guarantee hold, all in DEPLOYMENT.md section 6 — rules deploy on
  **every** push rather than only when the file changed, they deploy **before** Pages, and
  the workflow is `cancel-in-progress: false` so a superseding push cannot kill a
  half-finished release.
- **The app icon, generated from code** — `tools/appIcon/`. A three-quarter progress ring
  with a chevron climbing out of it: the rest timer and the number going up, which are the
  two shapes already on the app's screens the most. Seven PNGs covering the three ways
  platforms crop an icon. There is no image dependency; the tool contains a small
  supersampling rasteriser and a PNG encoder, for the same reason the rest-timer chime is
  two synthesised sine waves rather than an audio file.
- **`npm run icons:generate` and `npm run icons:verify`**, mirroring the existing
  `media:copy` / `media:verify` pair. The verifier decodes the committed PNGs and compares
  **pixels**, not file bytes — zlib's exact output is not stable across Node versions, and a
  byte comparison would fail the build on a Node upgrade while the icons were unchanged.
- **`public/manifest.webmanifest`** — standalone, portrait, the palette's deep background as
  both theme and splash colour, and four icon entries covering `any` and `maskable`.
- **`index.html`** gained the manifest link, three icon links and the unprefixed
  `mobile-web-app-capable`. Every path is relative, like every other asset path in the build.
- **12 new tests, 978 in total, up from 966.** All of them cover the icon tooling, including one that renders the maskable
  variant and measures how far the mark actually reaches, and one that reads
  `purpleBluePalette.ts` and fails if the icon's colours drift from it.
- **Verified from a sub-path, not just from root.** The built `dist/` was served from
  `/second-body/` and every asset, both favicons, the apple-touch icon and all four manifest
  icons returned 200, with `start_url` and `scope` resolving to the sub-path and no console
  errors. This is the claim DEPLOYMENT.md section 4 makes, and it is now the claim the
  manifest depends on too.

**Decisions made and why**

| Decision                                                                | Reason                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The rules deploy on every push, not only when `firestore.rules` changed | Conditioning on the diff reintroduces exactly the drift this exists to prevent — most obviously when somebody edits the rules in the Firebase console. Redeploying identical rules is a no-op. `main` always wins                                             |
| Rules before Pages                                                      | A new app version that needs a permission must never meet the old ruleset. Rule changes are almost always additive, and an additive rule a minute early is harmless to the version still live                                                                 |
| A service account key, against what DATA_MODEL.md used to say           | Omar's call, made with the alternatives in front of him. Workload Identity Federation would have avoided a long-lived credential but costs half an hour of `gcloud` setup. DATA_MODEL section 5 was rewritten rather than left contradicting the workflow     |
| The key is scoped to Firebase Rules Admin and nothing else              | It publishes rules. It has no reason to read the database, and the narrow role is what makes a leak a failed deploy rather than an incident                                                                                                                   |
| A missing secret fails the deploy rather than skipping the rules job    | Skipping silently and shipping the app against whatever rules happen to be live is precisely the failure this milestone exists to remove                                                                                                                      |
| `firebase-tools` is pinned to an exact version in the workflow          | A CLI release must not be able to change what a deploy does. The pin matches the version in SETUP_FIREBASE.md; bump both together                                                                                                                             |
| The icon is code, not a committed image from a design tool              | It shows up in a pull request as a diff of named numbers rather than "binary file changed", it cannot drift from the palette because a test reads the palette, and it costs no native image dependency                                                        |
| The manifest has **no** `id`                                            | `id` resolves against the _origin_, not the manifest URL. `"./"` would have claimed `https://<username>.github.io/` — the whole account, shared with every other project hosted there. Omitted, it defaults to `start_url`, which resolves to `/second-body/` |
| `apple-touch-icon` is the full-bleed variant, not the rounded one       | iOS ignores the manifest's icons entirely, applies its own corner mask, and renders transparency as black. A squircle with transparent corners would have shipped a black-cornered icon                                                                       |
| No service worker, still                                                | M9 was not the milestone to reopen that. Offline remains descoped — DATA_MODEL section 7 and the ROADMAP row both still stand                                                                                                                                 |

**Left for Omar**

Three things, none of which an agent can do, in order:

1. Push `feat/pages-deployment` and open the pull request.
2. **Settings -> Pages -> Source: GitHub Actions.** Not "Deploy from a branch".
3. **Add the `FIREBASE_SERVICE_ACCOUNT` secret** — SETUP_FIREBASE.md step 8, which is new.
   The `deploy-firestore-rules` job fails with a message naming the step until this is done.

The first deploy is also the first time the workflow has ever run. If something in it is
wrong, that is where it will show up — the `build` job is the same set of checks CI already
runs green on pull requests, so the new ground is the two deploy jobs.

**Not done, on purpose**

- **The rules are not unit tested.** Deploying them from CI guarantees that what is live
  matches the repository; it does not check that what is in the repository is right. The
  Firebase emulator plus `@firebase/rules-unit-testing` would do that, at the cost of a JDK
  in CI and a new dev dependency. Worth considering the first time the rules become more
  than the eight lines they are today.
- **Nothing was changed about offline, notifications or a native shell.** Omar asked what an
  Android build would take, decided against it for now, and asked to stick to the plan. The
  ROADMAP row saying a PWA is enough is therefore left standing rather than quietly
  rewritten.

**Follow-up: the first CI run went red, and it was not M9's doing**

Merged to `main`, and the deploy failed on `App > offers a way into the session player`:

```
Unable to find role="link" and name `/start the session/i`
```

**A test that only passed three days a week.** `buildOnboardedProfile` in `App.test.tsx`
trains Monday, Wednesday and Friday, and the file read the real clock. On a training day the
Today screen offers "Start the session"; on a rest day the very same link reads "Train it
today instead". So the test passed on Mon/Wed/Fri and failed the other four days. M9 was
committed on a Monday and pushed on the Tuesday, which is the entire story — the test has
been like this since the Today screen was built in M6, and nothing in M9 touched it.

**Fixed by pinning the clock, not by loosening the assertion.** `App.test.tsx` now fakes
`Date` only — faking the timers as well would stop Testing Library's `findBy*` queries and
`userEvent` from ever resolving — and sets it to a Monday during the programme. The date is
written without a timezone on purpose, so it parses as local time and is a Monday on a UTC
runner and on a UTC+3 laptop alike. The assertion stays exact rather than being softened to
"some link into the session player", because with the clock pinned it can be.

**The whole suite was audited rather than assumed.** All 978 tests were run against six
frozen dates — a Tuesday, a Saturday, a Sunday, and three dates in late 2026 and 2027 well
past the twelve-week programme. Before the fix, exactly one test failed and only on non
Mon/Wed/Fri dates. After it, 978 pass on every one. The `src/domain/` rule that nothing reads
a clock is why the damage stopped at a single file.

**Nothing half-shipped.** The failure was in the `build` job, which both deploy jobs depend
on, so neither the rules nor Pages were touched. That is the ordering in DEPLOYMENT.md
section 6 doing exactly what it is there for, on its first real outing.

Branch: `fix/clock-dependent-app-test`. One file changed.

**Follow-up 2: the rules deploy failed on a role step 8a did not ask for**

With the clock fix merged, `build` went green and the deploy reached the rules job, which
failed:

```
403, Permission denied to get service [firestore.googleapis.com]
```

**The setup instructions were wrong, not the setup.** Before deploying, the Firebase CLI
checks that `firestore.googleapis.com` is enabled on the project. That check is a read
against the Service Usage API, and **Firebase Rules Admin does not grant it** — so step 8a,
which said to add that role and no other, produced a service account that could publish
rules but could not get as far as trying.

**The fix is one more role**, not a new service account and not a new key:
**Service Usage Viewer** (`roles/serviceusage.serviceUsageViewer`). Confirmed against
Google's Service Usage access-control documentation as the narrowest predefined role
containing `serviceusage.services.get`, which is the permission the error names. It reads a
list of which Google APIs are switched on and grants nothing over any data — neither role
can read the database. Step 8a and DATA_MODEL section 5 both now say two roles, and section
5 no longer claims the key is scoped to rules and nothing else.

**Deliberately not Service Usage Admin.** The error is a denied _get_. Admin would also
allow _enabling_ APIs, which is a genuinely bigger permission and is not needed — Firestore
has been enabled since M4. If the log ever says "permission denied to **enable** service",
that is a different problem and the answer is to switch the API on by hand, not to widen the
key.

**The job now prints which identity it is deploying as**, before it does anything: the
service account address and the project id from the key. Both are identifiers rather than
credentials — the same distinction section 5 draws about the Firebase config — and they turn
"wrong account" and "wrong project" into something visible in the log instead of a guess.
The step is `continue-on-error`, because a diagnostic must never be able to block a release.

SETUP_FIREBASE.md also gained a troubleshooting table for this job, keyed by the exact error
text, since every one of these failures names the permission it wants if you read it.

**Follow-up 3: past the precheck, stopped at the deploy itself**

Service Usage Viewer worked — `required API firestore.googleapis.com is enabled` now passes.
The next call failed instead:

```
firebaserules.googleapis.com/v1/projects/second-body-osi:test
403, The caller does not have permission
```

`:test` is the CLI compiling the rules before uploading, and it is the **first call that
needs a `firebaserules` permission at all**. `roles/firebaserules.admin` contains
`firebaserules.rulesets.test`, so the reading is that the role is not actually on the
account — most likely because the creation wizard's "Grant this service account access to
project" panel was skipped, which produces a valid service account with no permissions.

Two details make that the likely story rather than a guess. Service Usage Viewer was added
deliberately afterwards and took effect immediately, so grants propagate and the right
project is being edited. And the error names no permission at all, which is what a plain IAM
denial looks like here — as opposed to the previous one, which named
`serviceusage.services.get` outright.

**Nothing was changed in the workflow.** This is a console-side fact, so the work was to make
the documentation able to answer it: the troubleshooting table now keys off the URL in the
error rather than a permission name that this failure does not carry, and there is a section
on where granted roles are actually visible — the IAM page, not the Service Accounts page,
which is the usual reason someone is sure they granted a role that is not there.

If Firebase Rules Admin turns out to be present, this diagnosis is wrong and the next things
to rule out are the key belonging to another project — the job now prints its project id —
and the service account being disabled.

---

### Session 15 - 2026-09-01 - M10 the training journal

**Agent:** Claude (Opus 5)
**Branch:** `feat/training-journal`, branched off `main`

The last milestone. Two halves of one idea: a place to write things down during the week, and
a way to get everything out so a conversation about it can happen in Claude Code with the data
already in front of it.

**Done**

- **`journalEntries`, the collection.** `journalTypes.ts`, `journalEntryDrafting.ts`,
  `journalDocumentMapping.ts` and `journalEntriesRepository.ts` — the same four-file shape as
  every other collection. Two things about it are unlike the others:
  - **Append only.** No update, no delete, deliberately. An entry is a record of what somebody
    thought on a day, and an edit would rewrite the history a review reads. If a note turns out
    to be wrong, another note saying so is the honest fix.
  - **The mapping never drops an entry.** Every other mapping here either throws on an
    unrecognised value or silently discards it. Neither is right for somebody's own words, so
    an unknown `entryKind` falls back and the text still comes back. `bodyText` itself is
    required, because an entry that reads as an empty string is worse than an error.
- **`src/domain/coachingBundle.ts`** — everything a coach would need, as one object. It is not
  a Firestore dump: exercise ids resolve to names, each set collapses to one line
  (`"60 kg x 8 brutal (prescribed 10)"`), and every aggregate comes from the domain function
  the app's own screens already use, so the bundle and the Progress tab cannot disagree.
- **`src/domain/coachingBundleAssembly.ts`** — stored documents to a finished bundle, in one
  pure function, because there are two callers and they must not diverge.
- **The journal screen** at `/journal`, reached from a panel on Today. Composer, entry list,
  three kinds of note, and an optional session or movement tag.
- **A download button in Settings**, and **`npm run coach:export`** — a Node script using
  `firebase-admin` with Application Default Credentials, writing to a gitignored `.coaching/`.
- **`.claude/skills/coach-review/SKILL.md`** — how to find a bundle, what is in it, what order
  to read it in, and what not to do with it.
- **`WEEKDAY_NAMES` moved into `calendarDates`.** The Schedule header had its own copy and the
  bundle needed one; two lists that start the week on different days is a bug waiting.
- **118 new tests, 1,096 in total**, up from 978.

**Decisions made and why**

| Decision                                                                 | Reason                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The journal is not a fifth tab                                           | `BottomNavigation` already says why: four targets across a phone is comfortable and five is fiddly. It sits inside the shell, reached from Today, the same shape the exercise library was always going to have                                                               |
| The export script loads `src/` through Vite's `ssrLoadModule`            | The alternative was a second copy of the bundle shape written in JavaScript, which would start identical and drift — the entire failure this design exists to prevent. It costs a second of start-up and no new dependency, since Vite is already a dev dependency           |
| Application Default Credentials, not a second service account key        | The existing key is narrow enough that leaking it means a failed deploy. A key that can read the whole training log, living on a laptop, is a different category of thing. ADC has no file to leak and revoking it is revoking your own session                              |
| The queries in the export script are written out again                   | A Node process has no browser to sign in with, so it cannot use `src/services/repositories/`. Each query names the repository it mirrors in a comment. The **limits** are not duplicated — both callers read `COACHING_EXPORT_LIMITS`                                        |
| The document **mappings** are not written out again                      | They import no Firebase at all, which M4 did to make them testable and which turns out to be exactly what lets an admin-SDK document go through the same translation the app uses                                                                                            |
| A set is one line of text, not an object                                 | A session is thirty of them. Thirty five-field objects would be most of the bundle for none of the meaning. `(prescribed N)` and `(sharp pain)` appear only when true, because a line saying "no pain" thirty times buries the one that does not                             |
| The effort rating stays as the stored word                               | `justRight` rather than "just right". A bundle is a view of the database, and prettying the values would mean a reader seeing something the database does not say. It also avoids a fourth copy of a label that already exists in a feature this layer may not import        |
| `reviewStatus` is written although nothing flips it                      | The flip belongs to the unscheduled write-back half. Adding the field later would mean backfilling every document written before it, and `readJournalEntriesAwaitingReview` already queries on it. Recorded in the type, the README and DATA_MODEL so it is not read as dead |
| The journal write is the one write in the app that is **not** optimistic | A rolled-back tick has cost nobody anything. A rolled-back paragraph has thrown away something that only existed in somebody's head                                                                                                                                          |
| The composer validates on submit, never while typing                     | A form that turns red halfway through a sentence about a sore knee is a form that teaches you not to write sentences about sore knees                                                                                                                                        |
| Changing the tagged session clears the tagged movement                   | The movement list is drawn from the selected session, so keeping it would put a leg press on a pulling session in the bundle. There is a component test for exactly this                                                                                                     |
| The content facts are gathered in `src/content/coaching/`                | Both callers need the programme, the step ramp, the sleep target and an exercise-name resolver. Gathering them at each caller is how one ends up using `shortDisplayName` and the other `displayName`, which would change the bundle and nobody would notice                 |
| The tag fields are one per row rather than a wrapping grid               | Found by looking at it: two of them fit across a 375px phone by about one pixel, so the layout flipped between one column and two on nothing. Full width is the better thumb target anyway                                                                                   |

**Notes for the next session**

- **Nobody has still walked a real session in a gym.** Unchanged since M5 and still the check
  that matters most. M10 adds a second thing to do on that trip: write a journal entry on the
  phone, then run `npm run coach:export` at home and read what comes out.
- **The export script has never been run against the real project.** Its pure parts are tested
  — arguments, assembly, determinism — but the `firebase-admin` half has only been reasoned
  about. It needs `gcloud auth application-default login`, and it needs data in Firestore to be
  worth running, so the first real run belongs with the gym trip.
- **`firebase-admin` is a new dev dependency**, and it brings six moderate advisories with it,
  all through a transitive `uuid`. `npm audit --omit=dev` reports **0** — none of this reaches
  the shipped bundle, which does not contain `firebase-admin` at all. It is a local script run
  by hand. Left alone rather than force-fixed, because `npm audit fix --force` would move
  `firebase-admin` itself.
- **The panels were verified through a throwaway preview**, the trick sessions 10 to 12
  recorded: a scratch component plus a one-line swap in `main.tsx` rendered the composer, the
  entry list, the Today prompt and the export panel with fixture data, and both were reverted
  before committing. One real problem came out of it and is in the decisions table above.
- **The journal screen reads the preferences document itself** rather than borrowing
  `useTrainingOverview`, which was the first attempt. That hook also reads the programme
  assignment and forty sessions, and the journal wants neither — three reads to render one
  coach line would have been a poor trade on a screen somebody opened to type a sentence.
- **The journal composer and the entry list are the only new components**, and neither is in
  `src/components/`. Nothing else needs them yet. If a second feature ever renders a note, the
  entry list is the one to promote.
- **`COACHING_BUNDLE_FORMAT_VERSION` is 1.** Bump it when the shape changes in a way a reader
  would need to know about, and say what changed in the `coach-review` skill at the same time —
  the skill is the thing that reads it.
- The bundle carries the whole body-weight series rather than only the headline average. It is
  about thirty numbers over a block, and it is the thing a coach actually reads.
- The built bundle is 1,138 kB before gzip (334 kB after), up from 1,090 at the end of M7.
  `firebase-admin` is nowhere near it — the export script is a dev tool, not part of the app.
