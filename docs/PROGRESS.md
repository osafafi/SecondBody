# Progress Log

**If you are an agent picking this project up, read this file first.**

It records what has been built, what is being built, and what is next. Every session must
add an entry. An unrecorded session is a session the next person has to reverse-engineer.

---

## Current state

|                       |                                                                   |
| --------------------- | ----------------------------------------------------------------- |
| **Current milestone** | M4 — Firebase data layer                                          |
| **Status**            | Complete. Awaiting review on `feat/firebase-data-layer`           |
| **Current branch**    | `feat/firebase-data-layer`, branched off `main`                   |
| **App runs?**         | Yes — `npm run dev`. Sign in, onboard, then the same four screens |
| **Backend wired?**    | Yes. Auth, rules, seven typed repositories and onboarding         |
| **Deployed?**         | No — arrives in M9                                                |

> **Read session 6 before touching the exercise animations.** The generated SVGs are gone.
> The media is now sourced from an open dataset, and it is **not this project's to
> redistribute freely** — see [EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md) section 2.

### What to do next

**M4 is finished.** Review `feat/firebase-data-layer`, then start **M5 — the active session**
on `feat/active-session`. Read [TRAINING_PROGRAM.md](TRAINING_PROGRAM.md) sections 5 to 7 and
the `workoutSessions` shape in [DATA_MODEL.md](DATA_MODEL.md#3-document-shapes) first.

M5 inherits a working backend and needs no setup of its own. What is already there for it:

- `createWorkoutSession` / `saveWorkoutSession` / `readInProgressWorkoutSession` in
  `src/services/repositories/workoutSessionRepository.ts`. The last of those is what lets the
  app offer to resume a session the phone interrupted.
- `useUserProfile()` for pain areas, equipment and excluded exercises — the three things that
  decide what a session may prescribe.
- `readActiveProgramAssignment` for where in the twelve weeks he is.
- `ExerciseAnimation` from M3, still drawn only by the development review screen.

**Every Firebase setup step is done and verified.** The project exists (`second-body-osi`,
me-central1), Google Sign-In is on, Firestore is created, the rules are deployed and the
authorised-domain list is correct. Do not ask Omar for any of it again — read sessions 8 and
9 first.

From M3 you inherit `ExerciseAnimation`, ready for the session player in M5. Nothing in the
shipping app draws it yet — only the development review screen does. Twenty-seven exercises
have an animation and nine draw a "No preview yet" fallback; the nine are listed, with
reasons, in `src/content/exerciseMedia/exerciseMediaMatches.ts`.

---

## Milestones

One branch and one pull request each. Do not mix milestones.

| #   | Branch                         | Contents                                                                                      | Status      |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------- | ----------- |
| M0  | `feat/repo-foundation`         | Git, Vite + TS scaffold, lint, format, tests, all docs, CI                                    | **Done**    |
| M1  | `feat/design-system`           | Tokens, palettes, `GradientSurface` and primitives, app shell, bottom nav, palette switcher   | **Done**    |
| M2  | `feat/training-content`        | Exercise database, 12-week programme, mobility routines, coach voice, `domain/` logic + tests | **Done**    |
| M3  | `feat/exercise-media-pipeline` | Media spec, dataset match table, copy tool, verifier, 27 animations + 9 fallbacks             | **Done**    |
| M4  | `feat/firebase-data-layer`     | Firebase init, Google Sign-In, typed repositories, security rules, onboarding                 | **Done**    |
| M5  | `feat/active-session`          | Session player state machine, set logging, rest timer, wake lock                              | Not started |
| M6  | `feat/dashboard-and-schedule`  | Today screen, calendar, 48-hour recovery awareness                                            | Not started |
| M7  | `feat/progress-tracking`       | Weight trend, volume charts, personal records                                                 | Not started |
| M8  | `feat/habits-and-settings`     | Daily habit checklist, settings screen, profile editing                                       | Not started |
| M9  | `feat/pages-deployment`        | Deploy workflow, web manifest, icons, production Firebase config                              | Not started |

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
