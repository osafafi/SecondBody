# Progress Log

**If you are an agent picking this project up, read this file first.** It is short on
purpose.

It records where the project actually is, what was decided and must not be quietly
revisited, and what to do next. The blow-by-blow history of every session lives in
[SESSION_LOG.md](SESSION_LOG.md) — go there when you need to know _why_ something is the way
it is.

---

## Current state

|                           |                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Version**               | **v0 — shipped, and trained on once**                                                                                    |
| **Milestones**            | M0 to M10, all done and all merged. The list is closed                                                                   |
| **Current branches**      | Three stacked ones answering F7 to F13, all now merged, plus `feat/generated-warmup-animations` for F14. **None pushed** |
| **Live at**               | **https://osafafi.github.io/SecondBody/** — installed to a home screen and signed in                                     |
| **Deployed?**             | **Yes.** Every push to `main` builds, deploys the Firestore rules, then deploys Pages                                    |
| **App runs locally?**     | Yes — `npm run dev`. Sign in, onboard, then all four tabs plus the journal are real                                      |
| **Backend wired?**        | Yes. Every collection in the data model has a caller both ways                                                           |
| **Real training?**        | **One session, on 2026-09-02.** Firestore also holds one nobody trained — F6, still Omar's to delete                     |
| **Where work comes from** | [FEEDBACK.md](FEEDBACK.md), not the milestone table                                                                      |

> **Read session 6 in [SESSION_LOG.md](SESSION_LOG.md) before touching the exercise
> animations.** The generated SVGs are gone. 27 of the 35 animations are sourced from an open
> dataset and are **not this project's to redistribute freely** — see
> [EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md) section 2. The other 8 were generated for
> this app in session 19 and are ours. Which is which is the `mediaSource` field on every row
> of `src/content/exerciseMedia/exerciseMediaMatches.ts`, and it is the only thing that
> answers the question.

### The branches, and the order they were merged in

The first three were **stacked**: branch 2 was cut from branch 1, branch 3 from branch 2.
Two of them touch `ExerciseBriefPanel` and `ActiveSessionScreen` and all three touch the
docs, which is why they were stacked rather than parallel. All three are merged into local
`main`, along with `fix/formatting-and-the-verify-gate` behind them. `main` has not been
pushed.

| Order | Branch                             | Closes          | State                  |
| ----- | ---------------------------------- | --------------- | ---------------------- |
| 1     | `feat/session-board-and-parking`   | F7, F8, F9, F10 | Merged into `main`     |
| 2     | `feat/warmup-you-can-work-through` | F11, F12        | Merged into `main`     |
| 3     | `feat/exercise-availability`       | F13             | Merged into `main`     |
| 4     | `feat/generated-warmup-animations` | F14             | Cut from `main`, ready |

### What production has actually exercised

"It is live" gets read as "all of it works". It does not, yet. Be precise about this.

| Proven in production                                                          | Still unexercised                                                           |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Build, rules deploy and Pages deploy, end to end                              | Everything added on the three branches above — none of it is deployed yet   |
| Google Sign-In from the Pages domain                                          | Journal capture on the phone, and `npm run coach:export` against real data  |
| Onboarding, written through to `users/{uid}` — profile and assignment exist   | Every screen that needs several completed sessions to have anything to show |
| Installing to a home screen: manifest, icons, standalone launch               | The progression rules, which need a second session to have anything to do   |
| **The session player, in a gym, on a phone** — one full session on 2026-09-02 |                                                                             |

### What to do next

**0. Clear the training data that is in Firestore and should not be** — F6 in
[FEEDBACK.md](FEEDBACK.md), and the procedure is
[DATA_MODEL.md section 8](DATA_MODEL.md#8-starting-again-from-a-clean-slate). A walk through
the session player during development wrote a real `workoutSessions` document, so the app
believes it was trained on a day nobody trained. Everything downstream reads it as evidence
— the Today screen, the calendar, and the progression that decides what weight goes on the
bar. **It was meant to be done before the first real session and was not**, so there is now
a real session sitting next to a phantom one, and the phantom is the more recent of the two.
Deleting `workoutSessions` wholesale would take the real one with it, so this now needs the
phantom document deleted **by id** and the real one from 2026-09-02 kept. Only Omar can do
it; nothing in this repository has Firestore credentials.

**1. Push `feat/generated-warmup-animations`.** The three stacked branches are merged; this
one is cut from `main` after them and answers F14. The next session is on 2026-09-04, and
none of this is deployed until it is pushed.

**2. Then read [FEEDBACK.md](FEEDBACK.md).** That is where what comes back from a real gym
gets written down, and it is the planning surface now. Do not invent an M11 — the milestone
table is a record of how v0 got built, not a plan. F15 is open and nobody has asked for it
yet: the 90/90 hip switch is the last movement with no animation.

**3. `npm run coach:export` has still never been run against the real project.** Its pure
parts are tested — argument parsing, assembly, determinism — but the half that talks to
`firebase-admin` has only ever been reasoned about. It needs
`gcloud auth application-default login`, and it needs sessions in Firestore to be worth
anything, so its first real run belongs after a session or two, not before.

### Standing facts that are easy to get wrong

**Every Firebase and GitHub setup step is done.** The project exists (`second-body-osi`,
me-central1), Google Sign-In is on, Firestore is created, the rules are deployed, the
authorised-domain list is correct, the `FIREBASE_SERVICE_ACCOUNT` secret is set, the service
account has both roles, and Pages is set to deploy from GitHub Actions. **Do not ask Omar for
any of it again** — [SETUP_FIREBASE.md](SETUP_FIREBASE.md) is kept as a rebuild guide, not as
a to-do list.

**The security rules are not deployed by hand.** Every push to `main` redeploys them, from the
same run and the same commit as the app, before the Pages deploy. If you change
`firestore.rules`, that is the whole procedure — do not run `firebase deploy` locally, the
next push would overwrite it anyway. The one case that needs care is a rules change that
_removes_ a permission the live app still uses, which needs two releases;
[DEPLOYMENT.md section 6](DEPLOYMENT.md#6-why-the-rules-deploy-from-ci-and-in-that-order)
explains why and in which order.

**There are no `ComingSoonPanel`s left, and the component is gone.** M8 was the milestone it
was supposed to die in, so it was deleted rather than left as dead code with a doc comment
promising it would be.

**`/library` is no longer a reserved path.** It was one from M3 until F2, and the note saying
so is now wrong wherever it survives. `features/exerciseLibrary/` owns `/library` and
`/library/:exerciseId`, and `features/schedule/` owns `/schedule/day/:isoDate`.

**The bottom navigation still has four items and should stay that way.** The library and the
journal are both reached from the Today screen instead. Five targets across a phone is
fiddly, which is the note on `BottomNavigation` and the reason two features have front doors
rather than tabs.

**`unavailableExerciseIds` is not `excludedExerciseIds`, and mixing them up would be bad.**
The blacklist is about his body, is set by a physio's advice, removes the slot entirely, and
is deliberately not editable from Settings. The unavailable list is about the room, is set
one-handed in a gym, swaps the movement rather than dropping it, and is deliberately
editable. Same shape of field, opposite reasons.

**Parking an exercise is not persisted, and that is deliberate.** `parkedExerciseIds` lives
in memory for the length of one session. A session resumed an hour later should not still
believe a machine is occupied.

**Two stored preferences are deliberately not editable**, and this is worth knowing before
someone "finishes the settings screen": `defaultRestSeconds` is read by nothing (rest comes
from the programme's own `restSecondsBetweenSets`) and `weightUnit` is rendered by nothing
(every weight in the app is kilograms). Putting switches on them would be shipping two
controls that change nothing. They are noted in the settings README.

**`reviewStatus` on a journal entry is written but never flipped.** That is deliberate, not
unfinished — flipping it belongs to the coaching write-back, which is on the
[ROADMAP](ROADMAP.md) and is not scheduled. See the M10 section below.

---

## Milestones

**This table is closed.** All eleven are done, one branch and one pull request each. It is
kept as a record of how v0 was built and of which branch to read for a given subsystem. New
work does not get a milestone number — it gets an item in [FEEDBACK.md](FEEDBACK.md).

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

### M10, and the half of it that is not built

M10 is the capture half of something Omar asked for during M7: an LLM he can talk to about his
training, in Claude Code, with the data already in front of it. The app does not get an LLM —
there is no server, no API key in a public static site, and no cost. The app becomes the
memory instead.

Three parts, of which **only the first two are built**:

1. **Capture.** A `journalEntries` collection under the user document — free text, written in
   the app during the week. Stored verbatim, never summarised on write, tagged with the
   session or exercise it is about, and carrying a `reviewStatus` so "everything since the
   last review" is one query rather than a re-read of everything.
2. **Retrieval.** A bundle builder in `src/domain/` — pure, so it is tested like everything
   else there and so both ways of getting at it produce identical output. Two callers: a
   download button in Settings, and `npm run coach:export`, a Node script using
   `firebase-admin` with Application Default Credentials (`gcloud auth application-default
login`) so that **no service account key file ever exists** — see DATA_MODEL section 5.
   Output goes to `.coaching/`, which is gitignored: it is precisely the personal data
   CLAUDE.md rule 2 exists to keep out of this repository.
3. **The write-back — not scheduled.** A review that can store what was concluded and, when it
   is worth it, a small closed vocabulary of adjustments the app knows how to honour. Left
   unscheduled on purpose: it is the half that changes what weight goes on the bar, and it
   should not be built until there are real weeks of real data to be wrong about. It is a
   [ROADMAP](ROADMAP.md) row, and `reviewStatus` is the field it would flip first.

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
| Repository     | `osafafi/SecondBody`, public. No personal data committed, ever                                                                                   |
| Git workflow   | Claude commits locally on feature branches. **Omar pushes and opens all pull requests**                                                          |
| Backend        | Firebase project `second-body-osi`, Google Sign-In, Firestore locked to one uid                                                                  |
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

## The session log

Eighteen sessions, in [SESSION_LOG.md](SESSION_LOG.md). **Add an entry there at the end of
every session, and update the current state table above at the same time.** An unrecorded
session is a session the next person has to reverse-engineer.
