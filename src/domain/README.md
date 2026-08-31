# `src/domain/`

Pure functions. No React, no Firebase, no side effects, no clock reads, no randomness.

This is the layer that decides **what weight goes on the machine**, so it is the part that
must not be wrong. Everything here is unit tested — that is a rule, not an aspiration.

## The dependency rule

`domain/` depends on nothing. In practice that means:

- **Type-only imports from `src/types/` are allowed.** They erase at build time and create no
  runtime dependency.
- **Value imports from anywhere outside `src/domain/` are not.** Notably, nothing here reads
  `src/content/`. When a calculation needs a fact from content — how an exercise is loaded,
  say — the caller passes it in. `resolveSessionPlan` takes a
  `resolveLoadingStyleForExercise` function for exactly this reason.
- **Nothing reads a clock.** The current time is always an argument. That is what turns "what
  happens at 23:00 on a Sunday" into a test rather than something discovered in a gym.

Tests may import content freely, and two of them do — testing the programme lookups against
a hand-built twelve week fixture would only prove they work on a fixture.

## What is in here

| File                     | What it decides                                                               |
| ------------------------ | ----------------------------------------------------------------------------- |
| `loadIncrements`         | How big a step up is, and how to land on a weight a gym actually has          |
| `exercisePrescription`   | Double progression, auto-regulation, and the two safety reductions            |
| `sessionPlanning`        | The whole session: sets, weights, warm-up, ramp set. Composes everything else |
| `warmupPlanning`         | Morning volumes or standard ones                                              |
| `programPhases`          | Which phase a week is in, which session comes next                            |
| `sessionScheduling`      | The 48-hour rail, and the next training day                                   |
| `layoffRecovery`         | What happens after ten days away                                              |
| `sessionVolume`          | Weight times reps, with dumbbell pairs and per-side reps counted properly     |
| `estimatedOneRepMax`     | Epley, for comparing sets that are not comparable on weight alone             |
| `habitTargets`           | The step target ramping from 5,000 to 9,000                                   |
| `bodyWeightExpectations` | When to raise the "the scale will not move yet" conversation                  |
| `coachLineSelection`     | Which line to say, and when to say nothing                                    |

## The rules these implement

Every rule here comes from [docs/TRAINING_PROGRAM.md](../../docs/TRAINING_PROGRAM.md). The
document is the source of truth for **intent**; this code is the source of truth for
**behaviour**. If they disagree, one of them is wrong — work out which, and fix that one.

The ones worth knowing before changing anything:

1. **Sharp pain outranks everything.** A set that caused sharp or joint pain drops the load
   20% and flags the exercise, even if every other set was perfect. It is a safety signal,
   not an effort signal.
2. **A brutal set drops the load 10%**, and outranks a session where every set hit the top
   of the range.
3. **Load only goes up when every set reached the top of the rep range.** Not the average,
   not the best set. Every set.
4. **Reductions round down.** 40 kg less 20% is 32 kg; the nearest selectable weight is 32.5,
   which is heavier than the reduction asked for. `roundWeightDownToLoadableValue` gives 30.
5. **Praise is spent, not sprayed.** `canSpendPraiseOnLoadDecision` allows it in exactly one
   situation. `selectCoachLine` returns null rather than reaching for something generic.
