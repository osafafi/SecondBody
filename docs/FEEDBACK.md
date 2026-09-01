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

| #   | What                                                        | Reported   | Notes                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F2  | Decide what `/library` is for, or delete the reserved route | 2026-09-01 | `APP_ROUTE_PATHS.exerciseLibrary` is a path with no screen behind it. It is documented as reserved rather than left to be rediscovered, but a constant nothing registers is still a decision nobody has made yet |

_The first real session is 2026-09-02. Expect this table to grow after it._

## In progress

| #   | What | Branch | Notes |
| --- | ---- | ------ | ----- |
| —   | —    | —      | —     |

## Done

| #   | What                                                                                     | Branch                            | Notes                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | The docs described an app that had not shipped, and a Library screen that does not exist | `docs/v0-state-and-feedback-loop` | v0 state recorded, session log split out, this file created, the real Pages URL written everywhere, and the phantom Library screen removed from the README |

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
