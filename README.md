# second body

A personal training coach in your pocket. A mobile-first web app that walks you through
a gym session set by set — which machine, which weight, how many reps, how long to rest —
the way a coach standing next to you would.

Built for one person, on purpose. It is not a general-purpose fitness app.

---

## What it does

| Screen       | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| **Today**    | What is on today, your streak, daily habit checkboxes, quick weight log       |
| **Session**  | The live workout player: one set at a time, with rest timers and form cues    |
| **Schedule** | Calendar of planned vs completed sessions, and where you are in the programme |
| **Progress** | Weight trend, training volume, personal records                               |
| **Library**  | Every exercise, with an animated demo and coaching notes                      |
| **Settings** | Colour palette, profile, targets, how chatty the coach is                     |

## Quick start

```bash
npm install
npm run dev
```

Then open the printed network URL on your phone — the dev server binds to your LAN so you
can test on the device you will actually use.

## Scripts

| Command                           | What it does                                               |
| --------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                     | Dev server, accessible from your phone on the same wifi    |
| `npm run build`                   | Type-check then produce a production build in `dist/`      |
| `npm run preview`                 | Serve the production build locally                         |
| `npm run verify`                  | Type-check + lint + test. **Run this before every commit** |
| `npm run test`                    | Unit tests once                                            |
| `npm run test:watch`              | Unit tests in watch mode                                   |
| `npm run lint` / `lint:fix`       | ESLint                                                     |
| `npm run format` / `format:check` | Prettier                                                   |
| `npm run media:generate`          | Draw exercise animations with the codex CLI                |
| `npm run media:validate`          | Check every exercise animation against its contract        |

## Documentation

Start here if you are picking this project up:

| Document                                                   | Read it when                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| [docs/PROGRESS.md](docs/PROGRESS.md)                       | **Always read first.** Where the project got to and what is next |
| [CLAUDE.md](CLAUDE.md)                                     | You are an AI agent working in this repo                         |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | You need to know where code lives and why                        |
| [docs/TRAINING_PROGRAM.md](docs/TRAINING_PROGRAM.md)       | You are touching exercises, programmes or progression            |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)             | You are writing any UI                                           |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md)                   | You are reading or writing user data                             |
| [docs/EXERCISE_MEDIA_SPEC.md](docs/EXERCISE_MEDIA_SPEC.md) | You are generating or editing exercise animations                |
| [docs/SETUP_FIREBASE.md](docs/SETUP_FIREBASE.md)           | You are setting up the backend for the first time                |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                   | You are shipping to GitHub Pages                                 |
| [docs/ROADMAP.md](docs/ROADMAP.md)                         | You are wondering what to build next                             |

## Tech

Vite + React + TypeScript, Firebase (Auth + Firestore), Zustand, CSS Modules with runtime
CSS custom properties for theming, framer-motion, lucide-react, Vitest.

Dark theme only. Mobile only. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for why each
of those choices was made.

## A note on privacy

This repository is public. **No personal data is stored in it.** Body weight, session logs
and measurements all live in Firebase, protected by security rules that allow exactly one
authenticated account to read or write them. The Firebase web config values that do appear
in this repo are public identifiers, not secrets — see
[docs/DATA_MODEL.md](docs/DATA_MODEL.md#why-the-firebase-config-is-not-a-secret).
