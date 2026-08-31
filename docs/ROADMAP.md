# Roadmap

Ideas beyond the ten milestones in [PROGRESS.md](PROGRESS.md). Nothing here is committed to
— it is a parking place so good ideas do not get lost, and so they do not get built too early.

The app is modular specifically so that anything on this list can be added without
disturbing what already works. If something here turns out to need an architectural change,
that is a signal worth investigating.

---

## Likely next, once the core works

**Programme block 2.** The current programme covers 12 weeks. Around week 10 the next block
needs designing — heavier, more free weights, probably a genuine upper/lower split. The
content layer already supports multiple programme templates, so this is content, not code.

**Plate calculator.** Given a target barbell weight, show which plates to load per side.
Small, genuinely useful, and about an hour of work.

**Warm-up set prescription.** Right now the programme prescribes working sets and a single
ramp set. Once loads are heavier, proper warm-up sets matter and should be calculated from
the working weight.

**Exercise substitution.** "Someone is on the leg press" is the single most common reason a
gym session goes off-plan. Let him swap to an equivalent movement that trains the same
pattern, and record what was actually done.

**Session history detail view.** Tap a past session, see every set. The data is already
stored; only the screen is missing.

**Body-weight trend intelligence.** A 7-day rolling average with a plain-language read on it
("you are down 1.4 kg over three weeks, that is bang on target"). Deliberately more useful
than a raw line chart, because a raw line chart is what makes people panic on a water-weight day.

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
feeling locked in, and easy to build.

**More palettes.** The architecture supports it fully — each palette is one file. Obvious
candidates: emerald-teal, amber-crimson, monochrome.

## Deliberately not doing

Recorded so the same conversation does not happen twice.

| Idea                                                       | Why not                                                                                                                                                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-user support, accounts, sharing                      | This is a single-user app. Adding users would complicate every security rule and every query for zero benefit                                                                            |
| Calorie and macro tracking                                 | Explicitly rejected. Food diaries are the most common reason beginners quit. The habit checklist is the deliberate alternative                                                           |
| Full offline support with a service worker                 | Explicitly descoped. Firestore's local cache covers realistic dropouts. Revisit only if a real gym-signal problem appears                                                                |
| A light theme                                              | Explicitly rejected. Dark only                                                                                                                                                           |
| A desktop layout                                           | It is used on a phone, in a gym, one-handed                                                                                                                                              |
| Social features, leaderboards, streaks shared with friends | Not what this is for                                                                                                                                                                     |
| A native app                                               | A PWA installed to the home screen already does everything needed here, without an app store                                                                                             |
| AI-generated raster exercise images                        | Considered and rejected in M0. SVG is smaller, sharper, palette-reactive and reviewable in a diff. See [EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md#1-why-svg-and-not-images-or-gifs) |
