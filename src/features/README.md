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

## Planned features

| Folder             | What it owns                                                              | Milestone |
| ------------------ | ------------------------------------------------------------------------- | --------- |
| `onboarding/`      | First-run profile setup: height, weight, goals, pain areas, gym equipment | M4        |
| `dashboard/`       | The Today screen — what is on, streak, habit ticks, quick weight log      | M6        |
| `activeSession/`   | The live workout player. The heart of the app                             | M5        |
| `schedule/`        | Calendar of planned vs completed sessions, phase progress                 | M6        |
| `progress/`        | Weight trend, training volume, personal records                           | M7        |
| `exerciseLibrary/` | Browse every exercise with its animation and coaching notes               | M5        |
| `settings/`        | Palette picker, profile editing, targets, coach verbosity                 | M8        |

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
