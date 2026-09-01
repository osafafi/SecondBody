# second body

A personal training coach in your pocket. A mobile-first web app that walks you through
a gym session set by set — which machine, which weight, how many reps, how long to rest —
the way a coach standing next to you would.

Built for one person, on purpose. It is not a general-purpose fitness app.

**Live at [osafafi.github.io/SecondBody](https://osafafi.github.io/SecondBody/)** — open it on
a phone and add it to the home screen.

---

## Status — v0

Everything described below is built, deployed and installed. **No training has been logged
yet**; the first real session is 2026-09-02, and the parts of the app that need completed
sessions have therefore never had anything real to show.

Where the project actually is, in detail: [docs/PROGRESS.md](docs/PROGRESS.md). What gets
built next comes from [docs/FEEDBACK.md](docs/FEEDBACK.md).

---

## What it does

| Screen       | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| **Today**    | What is on today, your streak, daily habit checkboxes, quick weight log       |
| **Session**  | The live workout player: one set at a time, with rest timers and form cues    |
| **Schedule** | Calendar of planned vs completed sessions, and where you are in the programme |
| **Progress** | Weight trend, training volume, personal records                               |
| **Journal**  | Free-text notes written during the week, stored exactly as you wrote them     |
| **Settings** | Colour palette, profile, targets, how chatty the coach is, data export        |

Four of those are the bottom navigation — Today, Schedule, Progress, Settings. The journal
sits inside the shell and is reached from Today, because five targets across a phone is
fiddly. **An exercise library is not built**; the animations are shown inside a session,
where they are actually needed.

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
| `npm run media:copy`              | Copy matched exercise animations out of the cloned dataset |
| `npm run media:verify`            | Check the committed animations against the match table     |
| `npm run icons:generate`          | Redraw the app icons in `public/icons/` from the artwork   |
| `npm run icons:verify`            | Check the committed app icons still match the artwork      |
| `npm run coach:export`            | Write your training history to `.coaching/` for a review   |

## Documentation

Start here if you are picking this project up:

| Document                                                   | Read it when                                                    |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [docs/PROGRESS.md](docs/PROGRESS.md)                       | **Always read first.** Where the project is and what is next    |
| [docs/FEEDBACK.md](docs/FEEDBACK.md)                       | You are wondering what to build next. This is the work queue    |
| [CLAUDE.md](CLAUDE.md)                                     | You are an AI agent working in this repo                        |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | You need to know where code lives and why                       |
| [docs/TRAINING_PROGRAM.md](docs/TRAINING_PROGRAM.md)       | You are touching exercises, programmes or progression           |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)             | You are writing any UI                                          |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md)                   | You are reading or writing user data                            |
| [docs/EXERCISE_MEDIA_SPEC.md](docs/EXERCISE_MEDIA_SPEC.md) | You are adding or changing an exercise animation                |
| [docs/SETUP_FIREBASE.md](docs/SETUP_FIREBASE.md)           | You are setting up the backend for the first time               |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                   | You are shipping to GitHub Pages                                |
| [docs/ROADMAP.md](docs/ROADMAP.md)                         | You want ideas nobody has asked for yet, and what was ruled out |
| [docs/SESSION_LOG.md](docs/SESSION_LOG.md)                 | You need to know **why** something ended up the way it is       |

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
[docs/DATA_MODEL.md](docs/DATA_MODEL.md#5-what-is-and-is-not-a-secret-here).
