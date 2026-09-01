# Roadmap

Ideas nobody has asked for. Nothing here is committed to — it is a parking place so good
ideas do not get lost, and so they do not get built too early.

**This is not the work queue.** v0 shipped and the milestone table in
[PROGRESS.md](PROGRESS.md) is closed; what actually gets built next comes from
[FEEDBACK.md](FEEDBACK.md), which is things that came back from using the app. The
difference is the point: this file is speculation, that file is evidence. An item moves from
here to there when something real makes the case for it.

The app is modular specifically so that anything on this list can be added without
disturbing what already works. If something here turns out to need an architectural change,
that is a signal worth investigating.

---

## Likely next, now that the core works

**Programme block 2.** The current programme covers 12 weeks. Around week 10 the next block
needs designing — heavier, more free weights, probably a genuine upper/lower split. The
content layer already supports multiple programme templates, so this is content, not code.

**Plate calculator.** Given a target barbell weight, show which plates to load per side.
Small, genuinely useful, and about an hour of work.

**Warm-up set prescription.** Right now the programme prescribes working sets and a single
ramp set. Once loads are heavier, proper warm-up sets matter and should be calculated from
the working weight.

**Exercise substitution.** "Someone is on the leg extension" is the single most common reason a
gym session goes off-plan. Let him swap to an equivalent movement that trains the same
pattern, and record what was actually done.

**Session history detail view.** Tap a past session, see every set. The data is already
stored; only the screen is missing.

**Body-weight trend intelligence.** A 7-day rolling average with a plain-language read on it
("you are down 1.4 kg over three weeks, that is bang on target"). Deliberately more useful
than a raw line chart, because a raw line chart is what makes people panic on a water-weight day.

**The coaching write-back.** M10 built capture and retrieval: notes are written in the app,
and a bundle comes out for a conversation in Claude Code. The third part — a review that can
store what it concluded, and a small closed vocabulary of adjustments the app knows how to
honour — is deliberately unscheduled. It is the half that changes what weight goes on the
bar, and it should not be built until there are real weeks of real data to be wrong about.
`reviewStatus` on a journal entry is the field it would flip first.

## Worth considering later

**Deload detection.** Watch for stalled progression, repeated "brutal" ratings, or a run of
poor sleep, and proactively suggest a light week rather than waiting for the scheduled one.

**Photo progress.** Store references only, keeping the images on the phone. Composition
changes show up in photos long before they show up on a scale.

**Apple Health / Google Fit import.** Automatic step counts instead of typing them in.
Requires OAuth flows that a static site makes awkward — needs research before committing.

**Rest-day suggestions.** On non-gym days, offer the mobility routine plus a step target
rather than showing an empty screen.

**Export to CSV.** All sessions and metrics out as a file. Cheap insurance against ever
feeling locked in, and easy to build. Partly answered by M10's coaching bundle, which is JSON
rather than CSV and is shaped for reading rather than for a spreadsheet — a CSV would still be
the better answer for "put my training in Excel".

**More palettes.** Three ship today (purple-blue, emerald-teal, amber-crimson). Adding
another is one file in `src/theme/palettes/` plus a line in the registry — it then appears
in Settings on its own. Obvious next candidates: monochrome, and a high-contrast variant for
reading the prescribed weight in bright gym lighting.

## Deliberately not doing

Recorded so the same conversation does not happen twice.

| Idea                                                       | Why not                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-user support, accounts, sharing                      | This is a single-user app. Adding users would complicate every security rule and every query for zero benefit                                                                                                                                                                |
| Calorie and macro tracking                                 | Explicitly rejected. Food diaries are the most common reason beginners quit. The habit checklist is the deliberate alternative                                                                                                                                               |
| Full offline support with a service worker                 | Explicitly descoped. Firestore's local cache covers realistic dropouts. Revisit only if a real gym-signal problem appears                                                                                                                                                    |
| A light theme                                              | Explicitly rejected. Dark only                                                                                                                                                                                                                                               |
| A desktop layout                                           | It is used on a phone, in a gym, one-handed                                                                                                                                                                                                                                  |
| Social features, leaderboards, streaks shared with friends | Not what this is for                                                                                                                                                                                                                                                         |
| A native app                                               | A PWA installed to the home screen already does everything needed here, without an app store                                                                                                                                                                                 |
| AI-generated exercise animations                           | Tried in M3 and abandoned. The generated SVGs were small, sharp, palette-reactive, reviewable in a diff — and not good enough to learn a movement from. Sourced from an open dataset instead. See [EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md#1-what-the-animations-are) |
