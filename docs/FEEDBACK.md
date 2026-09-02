# Feedback

**This is where work comes from now.** M0 to M10 built v0 and the milestone table in
[PROGRESS.md](PROGRESS.md) is closed. Everything after v0 starts here: something was used in
a gym, something was wrong or missing, it gets written down, and it becomes a branch.

Ideas nobody has asked for go in [ROADMAP.md](ROADMAP.md) instead. The difference matters —
this file is things that came from using the app, the roadmap is things that came from
thinking about it.

---

## How this works

1. **Anything Omar reports lands here first**, as a numbered item, in his words where they
   are clearer than a rewrite. Do not start building before the item exists.
2. **One item, one branch, one pull request.** Same rule the milestones had. Branch name is
   `feat/<slug>` for new behaviour, `fix/<slug>` for something broken.
3. **`npm run verify` before every commit**, and the branch goes in the item's row so a
   future session can find the change that answered it.
4. **Close it by moving it to "Done"** with the branch name, in the same session that
   finishes it. An item that says "In progress" for a week is an item nobody can trust.
5. **Not everything gets built.** Declining an item is a normal outcome — move it to
   "Declined" with the reason, so the same conversation does not happen twice.

Status is one of **Open**, **In progress**, **Done**, or **Declined**.

Items are numbered from `F1` upwards and numbers are never reused, including for declined
ones. A number that appears in a commit message must still resolve to a row here a year
later.

---

## Open

| #   | What                                                | Reported   | Notes                                                                                                                                                                                                                                                             |
| --- | --------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F6  | Firestore holds a session that was never trained    | 2026-09-01 | Today said "you trained yesterday" on an app that had never been used. A walk through the session player during development reached the end and wrote a real `workoutSessions` document. **Omar's to run** — see below                                            |
| F13 | A machine his gym does not have is still prescribed | 2026-09-02 | "some machines are not available in the gym. for example today's Low Row exercise. i replaced it with a machine. but i'd like to be able to flag an exercise as NOT available, so that the next session you can read that and we'll adapt the exercises."         |
| F14 | Four of the seven warm-up drills have no animation  | 2026-09-02 | Found while answering F11, not reported. Cat-cow, wall slides, chin tucks and the bodyweight hip hinge all draw "No preview yet". The cues carry them, but a picture is what F11 was asking for and these are the four movements least likely to be already known |

_F7 to F13 all came out of the first real session, on 2026-09-02. F6 predates it and is
still Omar's to run. F14 is the one item here nobody reported — it was found while answering
F11 and is written down rather than left as a surprise._

### F6, in full

This is not a code defect. Nothing in the app is wrong: a completed session document exists,
and every screen is reading it correctly. The document is simply not a session anybody
trained.

It cannot be fixed from this side — an agent has no Firestore credentials, and building a
"delete all my training data" button into the app to solve a once-a-project problem would be
putting an irreversible control on a screen used one-handed in a gym.

The procedure is **[DATA_MODEL.md section 8](DATA_MODEL.md#8-starting-again-from-a-clean-slate)**:
delete `workoutSessions`, `personalRecords` and `programAssignments` in the Firebase console,
and keep `profile` and `settings` so onboarding does not have to be done again. Close this
item once it has been done and the app says week 1 with nothing completed.

## In progress

| #   | What | Branch | Notes |
| --- | ---- | ------ | ----- |
| —   | —    | —      | —     |

## Done

| #   | What                                                                                     | Branch                             | Notes                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | The docs described an app that had not shipped, and a Library screen that does not exist | `docs/v0-state-and-feedback-loop`  | v0 state recorded, session log split out, this file created, the real Pages URL written everywhere, and the phantom Library screen removed from the README |
| F2  | Decide what `/library` is for, or delete the reserved route                              | `feat/browse-sessions-and-library` | **Decided by Omar asking for it.** `features/exerciseLibrary/` is built: every movement, searchable, with its animation and its cues, outside any session  |
| F3  | The calendar does not show the month                                                     | `feat/browse-sessions-and-library` | Each row of the grid carries a month heading, drawn when the month turns over. A straddling row goes to whichever month holds most of it                   |
| F4  | Sessions can only be started, not browsed                                                | `feat/browse-sessions-and-library` | `/schedule/day/:isoDate` — tap any day in the grid or any row in "Coming up". Past sessions show every set; planned ones show the movements and no weights |
| F5  | The exercise library was only reachable from inside a session                            | `feat/browse-sessions-and-library` | Same branch as F2 — the library is the answer to both. Reached from Today, from the Schedule header, and from every movement row on a session              |
| F7  | The rest screen will not show you the next exercise                                      | `feat/session-board-and-parking`   | The rest now shows the next movement with its animation, its weight and its first cue, and opens it in full or opens the whole session                     |
| F8  | You cannot look at an exercise without committing to it                                  | `feat/session-board-and-parking`   | `ExercisePreviewOverlay`. Closing it does nothing at all — the only control on it that reaches the state machine is "Do this one now"                      |
| F9  | A busy machine can only be answered with a skip                                          | `feat/session-board-and-parking`   | "Machine is busy" parks it: the session carries on and hands it back at the end. Parked is not skipped, and only becomes one, with a reason, at the close  |
| F10 | The session's exercises are a bare list of names                                         | `feat/session-board-and-parking`   | `SessionBoardOverlay` — a grid of cards with the animation on each, reachable from the header in every phase                                               |
| F11 | The warm-up is one block you cannot work through                                         | `feat/warmup-you-can-work-through` | Every drill is a card with its animation and its own screen: how to do it, what goes wrong, why it is there. The tick and the card are two separate taps   |
| F12 | Two minutes on the bike is too short                                                     | `feat/warmup-you-can-work-through` | Four minutes, five before 10:00. His number, asked for and given. TRAINING_PROGRAM.md section 3 updated to match                                           |

## Declined

| #   | What | Why not |
| --- | ---- | ------- |
| —   | —    | —       |

---

## What to expect from the first few sessions

Recorded before the fact, so that the first real feedback is read against something rather
than against nothing.

**The parts most likely to be wrong are the ones production has never touched.** The table in
PROGRESS.md lists them: the session player against real Firestore, the rest timer and wake
lock on a real phone, and every screen that needs completed sessions to have anything to
show. The build, sign-in, onboarding and the home-screen install are all proven; bugs there
would be surprising.

**Prescribed weights will be wrong at first, and that is the design working.** The programme
starts deliberately light and auto-regulates from the effort ratings — see
[TRAINING_PROGRAM.md](TRAINING_PROGRAM.md) section 7. "The first session was too easy" is
expected on week one and is not a bug. It becomes an item here only if it is still true after
the progression has had a couple of sessions to respond.

**Distinguish a wrong number from a wrong rule.** A weight that looks wrong on a screen is
usually `src/domain/` doing exactly what it was told, and the fix belongs in the programme
content or the progression rule with a test alongside it — never a patch at the component.

**Journal entries are not feedback items.** They are training notes, they live in Firestore,
and they are read through the coaching bundle and the `coach-review` skill. If a journal entry
turns out to describe a problem with the _app_, that becomes an item here — but the entry
itself stays where it is.
