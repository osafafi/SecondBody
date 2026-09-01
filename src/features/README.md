# Features

One folder per screen or self-contained capability. Each gets its own `README.md` when it
is built, explaining what it owns.

## The one rule

**A feature must never import from another feature.**

If two features need the same thing, that thing is not a feature concern:

| What you want to share | Where it belongs             |
| ---------------------- | ---------------------------- |
| A visual component     | `src/components/`            |
| A calculation          | `src/domain/` (with tests)   |
| Data access            | `src/services/repositories/` |
| React logic            | `src/hooks/`                 |
| Training data or copy  | `src/content/`               |
| A type                 | `src/types/`                 |

Features may import freely from all of the above. Only `src/app/` imports features.

This is what keeps a new feature from becoming a refactor. See
[ARCHITECTURE.md](../../docs/ARCHITECTURE.md#2-layers-and-the-dependency-rule).

## The features

| Folder                 | What it owns                                                              | Milestone |
| ---------------------- | ------------------------------------------------------------------------- | --------- |
| `authentication/`      | Google Sign-In, and the gate every other screen sits behind               | M4        |
| `onboarding/`          | First-run profile setup: height, weight, goals, pain areas, gym equipment | M4        |
| `activeSession/`       | The live workout player. The heart of the app                             | M5        |
| `dashboard/`           | The Today screen — what is on, the habit checklist, the quick weigh-in    | M6, M8    |
| `schedule/`            | Calendar of planned vs completed sessions, phase progress                 | M6        |
| `progress/`            | Weight trend, training volume, personal records                           | M7        |
| `settings/`            | Palette picker, profile editing, coaching and session preferences         | M8        |
| `journal/`             | Free-text notes written during the week, stored exactly as written        | M10       |
| `exerciseMediaReview/` | A dev-only contact sheet of every exercise animation                      | M3        |
| `exerciseLibrary/`     | **Not built.** No folder, no screen, no route                             | —         |

`APP_ROUTE_PATHS.exerciseLibrary` (`/library`) exists as a reserved path but no `<Route>` is
registered for it, so navigating there falls through to the catch-all and lands on Today.
Exercise animations are shown inside a session, where they are actually needed. If a library
is ever built, the path is waiting; until then do not link to it.

## Anatomy of a feature

```
features/activeSession/
  README.md                          what this feature owns and how it works
  ActiveSessionScreen.tsx            the route-level component
  ActiveSessionScreen.module.css
  components/                        components used ONLY by this feature
  useActiveSessionStore.ts           feature-local Zustand store, if needed
```

Anything in a feature's `components/` folder that a second feature turns out to need gets
promoted to `src/components/` — it does not get imported across the boundary.
