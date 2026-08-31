# Progress Log

**If you are an agent picking this project up, read this file first.**

It records what has been built, what is being built, and what is next. Every session must
add an entry. An unrecorded session is a session the next person has to reverse-engineer.

---

## Current state

|                       |                                                                       |
| --------------------- | --------------------------------------------------------------------- |
| **Current milestone** | M2 — training content (merged), plus a content correction on `main`   |
| **Status**            | Complete                                                              |
| **Current branch**    | `main`                                                                |
| **App runs?**         | Yes — `npm run dev`. Same four screens as M1. Neither change added UI |
| **Backend wired?**    | No — arrives in M4                                                    |
| **Deployed?**         | No — arrives in M9                                                    |

### What to do next

Start **M3 — exercise media pipeline** on branch `feat/exercise-media-pipeline`. Read
[EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md) first.

Everything M3 needs from M2 is in place: **36 exercises, each with a `mediaBrief`** giving the
start position, end position and equipment to draw. The generator reads those from
`src/content/exercises/` — `requireExerciseById(id).mediaBrief` — and the filenames are the
exercise ids, which the content tests already prove are camelCase.

The 24 movements the Phase 1 sessions and the warm-up use are the ones worth generating
first. Then the three Phase 2 and 3 additions (`shoulderPressMachine`, `gobletSquat`,
`dumbbellSplitSquat`, plus `rowingMachineEasy`), then the mobility-only drills, and last the
three that are defined but not prescribed (`seatedHipAdduction`, `ellipticalEasy`,
`barbellRomanianDeadlift`).

---

## Milestones

One branch and one pull request each. Do not mix milestones.

| #   | Branch                         | Contents                                                                                      | Status      |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------- | ----------- |
| M0  | `feat/repo-foundation`         | Git, Vite + TS scaffold, lint, format, tests, all docs, CI                                    | **Done**    |
| M1  | `feat/design-system`           | Tokens, palettes, `GradientSurface` and primitives, app shell, bottom nav, palette switcher   | **Done**    |
| M2  | `feat/training-content`        | Exercise database, 12-week programme, mobility routines, coach voice, `domain/` logic + tests | **Done**    |
| M3  | `feat/exercise-media-pipeline` | Media spec, exemplar SVG, codex generator, validator, Phase 1 animations                      | Not started |
| M4  | `feat/firebase-data-layer`     | Firebase init, Google Sign-In, typed repositories, security rules, onboarding                 | Not started |
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
| Visuals        | Animated SVG generated by codex, recoloured by the active palette                                                                                |
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
