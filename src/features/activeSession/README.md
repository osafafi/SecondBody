# Active session — the live workout player

The heart of the app. Everything else exists so this screen can tell him what weight to put
on the machine.

It is routed at `#/session`, **outside `AppShell`** so it takes over the whole display with
no bottom navigation to hit by accident mid-set, and **inside both gates** because it writes
to Firestore.

---

## The three layers

The complexity here is deliberately split three ways, and keeping them apart is what makes
the difficult part testable.

| Layer                                | Where                                       | What it owns                                  |
| ------------------------------------ | ------------------------------------------- | --------------------------------------------- |
| **What may follow what**             | `src/domain/activeSessionMachine.ts`        | The state machine. Pure. No clock, no network |
| **The clock, Firestore, the device** | `useActiveSessionStore.ts`                  | Reads, writes, the wake lock, the chime       |
| **What that looks like**             | `ActiveSessionScreen.tsx` and `components/` | One panel per phase, and nothing else         |

If you are about to add an `if` to a component, check whether it is really a rule. Rules go
in `src/domain/` with a test.

## The phases

```
warmingUp ──▶ exerciseBrief ──▶ setInProgress ──▶ loggingSet
                    ▲                                  │
                    │                                  ▼
                    └────────────── resting ◀──────────┘
                                       │
                                       ▼ (no exercises left)
                              sessionReview ──▶ completed
```

Three of these are named differently from the sketch in
[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md#6-state-management), which has been updated
to match: `setActive` and `setLogging` read as adjectives rather than as states, and
`cooldown` described a stretch that this step is not — it asks how the session felt.

## The five behaviours worth knowing about

1. **Sharp pain ends that exercise for the day.** A set logged with `didCauseSharpPain` moves
   the session on to the next exercise rather than offering another set of the movement that
   just hurt. The 20% reduction next session is handled separately, by the progression rules.
2. **An interrupted session resumes.** The session document is written after every set, and
   `readInProgressWorkoutSession` finds it again. `resumeActiveSessionState` picks up at the
   brief of the first exercise still owing sets — never back at the warm-up, because anything
   already logged means he is warm.
3. **No Firestore write is ever awaited.** A write made offline does not resolve until the
   device reconnects, and awaiting one would freeze the screen in a dead spot — which is
   exactly where this app is used. Writes are fired and their failures captured. Because
   every save writes the session document whole, only the most recent one has to land.
4. **The session is prepared once, when the screen opens.** `userProfile` comes from a
   Firestore subscription and arrives again whenever the server corrects the cached copy;
   re-planning on that would throw away everything logged so far, mid-workout.
5. **Finishing early still counts.** "Finish here instead" ends the session with what was
   done. Four exercises out of six is a session, not a failure.

## Files

```
ActiveSessionScreen.tsx        the route-level component: which panel to draw
useActiveSessionStore.ts       the Zustand store: preparation, events, persistence
activeSessionCoachLines.ts     which of Harout's categories belongs to which moment
prescriptionWording.ts         putting a prescription into words. Not coach copy
restTimerChime.ts              two synthesised notes when the rest is up
components/
  SessionHeaderBar             where he is, how far through, and the way out
  WarmupPanel                  the drills and the ramp set
  ExerciseBriefPanel           the animation, the cues, and what goes wrong
  SetInProgressPanel           the weight, at arm's length
  SetLoggingPanel              reps, weight, effort, pain
  RestTimerPanel               the countdown, and what is next
  SessionReviewPanel           how the session felt, and any notes
  SessionSummaryPanel          three numbers and a line from Harout
```

## What it does not do yet

- **Exercise substitution.** "Someone is on the leg extension" currently means skipping it.
  Every exercise already carries `substituteExerciseIds`; swapping to one is on the
  [roadmap](../../../docs/ROADMAP.md).
- **Filtering on available equipment.** The profile records what the gym has, and the planner
  does not read it. Dropping an exercise silently would leave a hole in the session, so this
  wants substitution first.
- **A skip reason.** Skips are recorded with `skipReason: null`. The field is stored and read;
  nothing asks for it yet.
