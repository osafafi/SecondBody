# Progress Log

**If you are an agent picking this project up, read this file first.** It is short on
purpose.

It records where the project actually is, what was decided and must not be quietly
revisited, and what to do next. The blow-by-blow history of every session lives in
[SESSION_LOG.md](SESSION_LOG.md) — go there when you need to know _why_ something is the way
it is.

---

## Current state

|                           |                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Version**               | **v0 — shipped, in use, no training data yet**                                                |
| **Milestones**            | M0 to M10, all done and all merged. The list is closed                                        |
| **Current branch**        | `main`. There is no milestone in flight                                                       |
| **Live at**               | **https://osafafi.github.io/SecondBody/** — installed to a home screen and signed in          |
| **Deployed?**             | **Yes.** Every push to `main` builds, deploys the Firestore rules, then deploys Pages         |
| **App runs locally?**     | Yes — `npm run dev`. Sign in, onboard, then all four tabs plus the journal are real           |
| **Backend wired?**        | Yes. Every collection in the data model has a caller both ways                                |
| **Real training?**        | **None.** Onboarding is done and Firestore has a profile. **The first session is 2026-09-02** |
| **Where work comes from** | [FEEDBACK.md](FEEDBACK.md), not the milestone table                                           |

> **Read session 6 in [SESSION_LOG.md](SESSION_LOG.md) before touching the exercise
> animations.** The generated SVGs are gone. The media is now sourced from an open dataset,
> and it is **not this project's to redistribute freely** — see
> [EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md) section 2.

### What production has actually exercised

"It is live" gets read as "all of it works". It does not, yet. Be precise about this.

| Proven in production                                                        | Still unexercised                                                             |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Build, rules deploy and Pages deploy, end to end                            | Everything downstream of starting a real session                              |
| Google Sign-In from the Pages domain                                        | The session player against real Firestore: set logging, rest timer, wake lock |
| Onboarding, written through to `users/{uid}` — profile and assignment exist | Journal capture on the phone, and `npm run coach:export` against real data    |
| Installing to a home screen: manifest, icons, standalone launch             | Every screen that needs completed sessions to have anything to show           |

### What to do next

**1. The first real session is on 2026-09-02.** This has been the top of this list since M5,
and every milestone that stood in the way is now done. Nobody has logged a real set on a real
phone with a real Firestore behind it. Everything below is downstream of it.

**2. Then read [FEEDBACK.md](FEEDBACK.md).** That is where what comes back from a real gym
gets written down, and it is the planning surface now. Do not invent an M11 — the milestone
table is a record of how v0 got built, not a plan.

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

Sixteen sessions, in [SESSION_LOG.md](SESSION_LOG.md). **Add an entry there at the end of
every session, and update the current state table above at the same time.** An unrecorded
session is a session the next person has to reverse-engineer.
