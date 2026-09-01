# Architecture

How the code is organised, and why it is organised that way.

---

## 1. The shape of the thing

This is a **single-user, mobile-only, dark-only web app** deployed as static files to
GitHub Pages, talking directly to Firebase from the browser. There is no server of our own
and there never will be — that is a deliberate constraint, not a limitation we are working
around.

```
  Phone browser
       |
       |  static files
       v
  GitHub Pages  ......  built from `dist/` by GitHub Actions
       |
       |  Firebase JS SDK (direct from the browser)
       v
  Firebase Auth (Google Sign-In)  +  Cloud Firestore
```

## 2. Layers and the dependency rule

```
    app/          router, providers, shell, navigation
      |
      v
    features/     one folder per screen. NEVER import another feature.
      |
      +--> components/   shared presentational primitives
      +--> theme/        palettes and CSS variable application
      +--> content/      static training data (exercises, programmes, coach lines)
      +--> services/     Firebase, repositories  ---> domain/, types/
      +--> domain/       pure functions. Depends on NOTHING.
```

**The rule, stated once:**

> `domain/` depends on nothing. `services/` may depend on `domain/` and `types/`.
> `features/` may depend on anything except another feature.
> Only `app/` depends on `features/`.

If you find yourself wanting one feature to import another, the thing you want to share
belongs in `components/`, `domain/` or `hooks/`. Move it there instead.

## 3. Why `domain/` is pure

`src/domain/` contains the logic that decides **what weight Omar puts on the machine**. It
has no React, no Firebase, no `Date.now()`, no randomness. Every input arrives as an
argument, including the current time.

That is not architectural purity for its own sake. It means:

- Every progression rule can be unit tested exhaustively, in milliseconds.
- Getting it wrong has a real physical cost, so it is the one part of the app that must be
  provably correct.
- The rules can be read and reviewed as plain functions, without needing to understand React.

**Everything in `domain/` must have tests.** This is enforced by convention and by review.

## 4. Repositories, not raw Firestore

Features never import from `firebase/firestore`. They call a repository:

```ts
// Good — a feature asks a repository a question in its own language.
const recentSessions = await workoutSessionRepository.findRecentSessions(userId, 10);

// Bad — a feature knows about collection paths and query syntax.
const snapshot = await getDocs(query(collection(db, 'users', userId, 'workoutSessions'), ...));
```

Each repository lives in `src/services/repositories/`, owns exactly one Firestore
collection, and is responsible for translating between Firestore documents and our domain
types. That translation is where dates get converted, defaults get applied, and unexpected
shapes get rejected.

This keeps Firestore's quirks in one layer, and means the storage backend could be swapped
without features noticing.

## 5. Content lives in git, user data lives in Firebase

This split matters and is easy to get wrong.

| Kind of data                                    | Where it lives            | Why                                                                                |
| ----------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| Exercise definitions, form cues, muscle targets | `src/content/exercises/`  | It is **content**. It should be reviewed in pull requests, versioned, and diffable |
| Programme templates, phases, progression rules  | `src/content/programs/`   | Same. Changing the programme is a code change with a reviewable diff               |
| Mobility routines                               | `src/content/mobility/`   | Same                                                                               |
| Harout's coaching lines                         | `src/content/coachVoice/` | Same — tone is tuned in one place                                                  |
| Body weight, measurements                       | Firestore                 | Personal. The repo is public                                                       |
| Completed sessions, sets, reps, ratings         | Firestore                 | Personal, and grows forever                                                        |
| Daily habit ticks                               | Firestore                 | Personal                                                                           |
| Settings, chosen palette                        | Firestore                 | Personal, and should follow him between devices                                    |
| Journal entries                                 | Firestore                 | The most personal thing here — it is what he chose to write down                   |

**Nothing personal is ever committed to this repository.**

The one place that pulls personal data back out onto a disk is the M10 coaching export, which
writes to `.coaching/`. That directory is gitignored, the script authenticates as the user
through Application Default Credentials rather than through a key, and the rule above is why
both of those are true. See [DATA_MODEL.md section 5](DATA_MODEL.md#5-what-is-and-is-not-a-secret-here).

## 6. State management

Three kinds of state, three different tools. Do not blur them.

| State                     | Tool                                | Example                         |
| ------------------------- | ----------------------------------- | ------------------------------- |
| Server data               | Repository call + local React state | The last 10 sessions            |
| Cross-screen client state | Zustand store                       | The in-progress workout session |
| Local UI state            | `useState`                          | Whether an accordion is open    |

The **active workout session** is the only genuinely complex piece of state in the app, and
it gets its own Zustand store modelled as an explicit state machine:

```
warmingUp -> exerciseBrief -> setInProgress -> loggingSet
                   ^                                |
                   |                                v
                   +----------- resting <-----------+
                                   |
                                   v  (no exercises left)
                           sessionReview -> completed
```

Modelling it as a machine rather than a pile of booleans is what stops the "am I resting or
am I mid-set?" class of bug, which would be very annoying with a phone in your hand and a
bar on your back.

The machine itself is `src/domain/activeSessionMachine.ts` — pure, with no clock and no
network — and the Zustand store in `src/features/activeSession/` is the impure shell around
it. **M5 renamed three of the states** this diagram originally carried: `setActive` and
`setLogging` read as adjectives rather than as states, and `cooldown` described a stretch
that the step is not — it asks how the session felt.

## 7. Routing

`HashRouter`, not `BrowserRouter`.

GitHub Pages serves static files with no server-side rewriting, so a deep link like
`/progress` would 404 on refresh. The usual workaround is a `404.html` that fakes a
redirect. `HashRouter` avoids the problem entirely — routes become `#/progress`, which the
server never sees.

The URLs are slightly uglier. Nobody will ever share a deep link into a single-user gym app,
so that costs us nothing.

Paired with `base: './'` in `vite.config.ts`, this also means **the build does not need to
know the repository name**, so it works from any Pages sub-path without configuration.

## 8. Styling

**CSS Modules plus CSS custom properties.** Not Tailwind, and that is a considered choice.

Omar asked to be able to change the colour palette from the settings screen at runtime.
That requires colours to be CSS custom properties resolved in the browser. Tailwind's model
is build-time utility generation, which fights that directly. CSS Modules also produce the
explicit, readable class names he asked for.

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for the visual rules.

## 9. Testing strategy

| Layer                    | Tested how                                                  | Coverage expectation                        |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------- |
| `domain/`                | Vitest unit tests, exhaustive                               | **100% of exported functions**              |
| `services/repositories/` | Unit tests of the mapping functions with fake documents     | The translation logic, not Firestore itself |
| `components/`            | Testing Library, only where there is logic worth protecting | Judgement                                   |
| `features/`              | Testing Library for the session player's state transitions  | The session player specifically             |

We do not test Firebase. We do not chase a coverage number.

## 10. Adding a new feature

1. Create `src/features/<featureName>/` with a `README.md` explaining what it owns.
2. Put any pure calculation in `src/domain/` **with tests**, not in the component.
3. Put any persistence behind a repository in `src/services/repositories/`.
4. Build the UI from `components/` primitives. Use `GradientSurface` for every panel.
5. Take all colours from CSS custom properties. Never a literal hex value.
6. Register the route in `src/app/`.
7. Update `docs/PROGRESS.md`.
