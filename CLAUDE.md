# Instructions for AI agents working in this repository

Read this before doing anything. Then read [docs/PROGRESS.md](docs/PROGRESS.md) to find out
where the project actually got to.

---

## 1. The golden rules

1. **Never push. Never open a pull request. Never touch a git remote.**
   Omar handles all remote operations himself. You work on a local feature branch and commit
   there. When you are done, tell him the branch name and stop.
2. **Never commit personal data.** No body weight, no measurements, no session logs, no real
   Firebase user IDs. That data belongs in Firestore. This repository is public.
3. **Run `npm run verify` before every commit.** Type-check, lint and tests must all pass.
4. **Update [docs/PROGRESS.md](docs/PROGRESS.md) at the end of every session.** It is the
   handover contract between sessions and between different agents. An unrecorded session is
   a session someone else has to reverse-engineer.
5. **One milestone, one branch, one pull request.** Do not mix milestones. Branches are named
   `feat/<milestone-slug>` — see the milestone table in `docs/PROGRESS.md`.

## 2. Naming

Omar reviews every pull request by reading it. Optimise for that.

- **Long explicit names beat short clever ones.** `calculateNextPrescribedWeight` not `calcWt`.
  `WorkoutSessionSummaryCard` not `SummaryCard`. This is a stated preference, not a suggestion.
- No abbreviations except universally understood ones (`id`, `url`, `db`, `max`, `min`).
- Booleans read as assertions: `isRestTimerRunning`, `hasCompletedOnboarding`, `shouldAutoAdvance`.
- Functions that do things start with a verb. Functions that answer questions start with
  `is` / `has` / `can` / `should`.
- Event handlers: `handleSetCompleted`, not `onSetCompleted` (reserve `on*` for props).

## 3. Where things go

```
src/
  app/          Router, providers, app shell, bottom navigation.
  features/     One folder per screen/feature. Each has its own README.md.
                Features may import from components/, domain/, services/, theme/, content/.
                Features must NOT import from each other.
  components/   Shared, presentational, feature-agnostic UI primitives.
                If it knows about workouts, it belongs in features/, not here.
  theme/        Palette definitions and the code that applies them to the document.
  content/      Static training data: exercises, programmes, mobility routines, coach lines.
                This is versioned content, reviewed in pull requests. It is NOT user data.
  domain/       Pure functions. No React, no Firebase, no side effects, no clock reads.
                Everything here must be unit tested. This layer decides what weight goes on
                the bar, so it is the part that must not be wrong.
  services/     Everything impure: Firebase init, auth, typed repositories.
                Features talk to repositories, never to Firestore directly.
  hooks/        Shared React hooks.
  types/        Shared TypeScript types that do not belong to a single layer.
  styles/       Global resets only. Everything else is a CSS Module.
```

**The dependency rule:** `domain/` depends on nothing. `services/` may depend on `domain/`
and `types/`. `features/` may depend on everything except other features. Nothing depends on
`features/` except `app/`.

## 4. Style conventions

- **CSS Modules only** (`ComponentName.module.css`) next to the component. No global classes,
  no inline style objects for anything themeable.
- **All colours come from CSS custom properties.** Never hard-code a hex value in a component
  or module. If you need a new colour, add it to the palette contract in `src/theme/`.
  Hard-coded colours break the palette switcher, which is a feature Omar asked for explicitly.
- **No flat surfaces.** Every panel uses the `GradientSurface` component. See
  [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- **Icons come from `lucide-react`.** Do not add another icon library.
- Prefer `type` over `interface` unless you need declaration merging.
- No `any`. No non-null assertions (`!`) without a comment explaining why it is safe.

## 5. Testing

- Everything in `src/domain/` must have unit tests. No exceptions.
- Components get tests when they contain logic worth protecting, not for the sake of coverage.
- Tests live next to the file they test: `progression.ts` -> `progression.test.ts`.
- Do not test Firebase. Test the repositories' translation logic with fakes instead.

## 6. Things that need Omar, not you

You cannot do these. Ask him and wait:

- Creating the Firebase project, enabling the Google auth provider, creating the Firestore
  database, adding authorised domains.
- Enabling GitHub Pages on the repository.
- Pushing branches and opening pull requests.
- Anything that spends money.

## 7. The coach's voice

The app speaks as **Harout** — a close friend of Omar's who happens to be a good coach.

- Informal, warm, direct. Contractions. Short sentences.
- Motivating, but praise is **earned and rationed**. Omar thrives on good feedback but not
  on a constant stream of it. A well-placed "that's a proper jump, nice" beats five "great
  job!"s.
- Constructive about failure. A missed session is a fact to work around, never a moral event.
- Honest. If something is going to be hard, say so before it happens.
- Never medical advice. Flag things worth asking a doctor about, once, then drop it.

All of Harout's lines live in `src/content/coachVoice/` so the tone can be tuned in one place
without touching components. Do not inline coach copy into JSX.
