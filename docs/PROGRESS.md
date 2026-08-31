# Progress Log

**If you are an agent picking this project up, read this file first.**

It records what has been built, what is being built, and what is next. Every session must
add an entry. An unrecorded session is a session the next person has to reverse-engineer.

---

## Current state

|                       |                                                                                 |
| --------------------- | ------------------------------------------------------------------------------- |
| **Current milestone** | M1 — design system                                                              |
| **Status**            | Complete, awaiting review                                                       |
| **Current branch**    | `feat/design-system`                                                            |
| **App runs?**         | Yes — `npm run dev`. Four screens, working navigation, working palette switcher |
| **Backend wired?**    | No — arrives in M4                                                              |
| **Deployed?**         | No — arrives in M9                                                              |

### What to do next

Start **M2 — training content** on branch `feat/training-content`. Read
[TRAINING_PROGRAM.md](TRAINING_PROGRAM.md) end to end first — M2 is the direct translation of
that document into `src/content/` and `src/domain/`, and the progression rules in section 7
are the part that has to be exactly right.

---

## Milestones

One branch and one pull request each. Do not mix milestones.

| #   | Branch                         | Contents                                                                                      | Status      |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------- | ----------- |
| M0  | `feat/repo-foundation`         | Git, Vite + TS scaffold, lint, format, tests, all docs, CI                                    | **Done**    |
| M1  | `feat/design-system`           | Tokens, palettes, `GradientSurface` and primitives, app shell, bottom nav, palette switcher   | **Done**    |
| M2  | `feat/training-content`        | Exercise database, 12-week programme, mobility routines, coach voice, `domain/` logic + tests | Not started |
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

## Locked decisions

Settled with Omar during the M0 interview. Do not silently revisit these — if one needs to
change, raise it with him.

| Area           | Decision                                                                                |
| -------------- | --------------------------------------------------------------------------------------- |
| Frequency      | 3 days per week, Monday / Wednesday / Friday, 45-60 minutes                             |
| Time of day    | Varies. Warm-up length adapts to session start time                                     |
| Medical        | Physio-cleared, no structural findings, no movement restrictions                        |
| Pain areas     | Neck and upper traps, lower back, shoulders, knees / hips / ankles                      |
| Experience     | Effectively a beginner. Full form cues on every set                                     |
| Cardio         | Incline treadmill walking and stationary bike. Rowing machine deferred to Phase 3       |
| Nutrition      | Four daily habit checkboxes. No calorie or macro logging                                |
| Home equipment | Mat, resistance bands, foam roller                                                      |
| Goal           | Body recomposition to ~82-84 kg with more muscle. **Not** weight loss alone             |
| Visuals        | Animated SVG generated by codex, recoloured by the active palette                       |
| Repository     | `second-body`, public. No personal data committed, ever                                 |
| Git workflow   | Claude commits locally on feature branches. **Omar pushes and opens all pull requests** |
| Backend        | New Firebase project, Google Sign-In, Firestore locked to one uid                       |
| Offline        | Not supported. Firestore's local cache covers brief dropouts only                       |
| Extras         | Home-screen install manifest, screen wake lock during sessions                          |
| Tracking       | Bathroom scale. Waist and other measurement fields exist but are optional               |
| Theme          | Dark only. Mobile only. Purple-blue palette by default                                  |

## Standing notes about Omar

- He reviews every pull request by reading it. Favour long explicit names and clear
  structure over cleverness.
- He responds well to genuine feedback but not to a constant stream of praise. Ration it.
- He was advised once to get a sleep apnea screen, given snoring plus low energy plus recent
  weight gain around the neck and chest. **Mentioned once. Do not bring it up again.**
- A tape measure was recommended and declined for now. The fields exist for when he changes
  his mind. Do not nag about this either.
