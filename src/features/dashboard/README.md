# Dashboard (the Today screen)

The screen the app opens on. It answers one question — **what is on today** — and gives the
way into it. Since M8 it is also where the day gets recorded: the habit checklist and the
quick weigh-in.

**Status:** built in **M6**, finished in **M8**.

## What it decides, and where

Almost nothing is decided here. The screen reads data, hands it to the domain layer, and
arranges what comes back.

| Question                                | Answered by                                          |
| --------------------------------------- | ---------------------------------------------------- |
| Where is the programme?                 | `useTrainingOverview` (`src/hooks/`)                 |
| Training, resting, recovering, or done? | `determineDailyTrainingStatus` (`src/domain/`)       |
| May a session start?                    | `canStartSessionFromTodayScreen` (`src/domain/`)     |
| Which session, and what is in it?       | `dueSessionOutline.ts`, from `src/content/programs/` |
| Does Harout have anything to say?       | `selectDailyCoachMoment` (`src/domain/`)             |
| Which line, at this verbosity?          | `dashboardCoachLines.ts` → `src/content/coachVoice/` |
| Which habits were met today?            | `habitCompliance.ts` (`src/domain/`)                 |
| What is the step target this week?      | `habitTargets.ts` (`src/domain/`)                    |
| What do the numbers read as?            | `habitWording.ts`, `todayWording.ts`                 |

## The six stances

`DailyTrainingStance` drives everything on the session panel. They are genuinely different
screens rather than one card with a different verb on the button:

| Stance              | What it says                        | Way into a session             |
| ------------------- | ----------------------------------- | ------------------------------ |
| `sessionInProgress` | One was left open                   | Yes — resume                   |
| `programmeFinished` | Twelve weeks are done               | No                             |
| `trainedToday`      | Today's work is logged              | No                             |
| `recovering`        | Inside the 48 hours, and until when | No                             |
| `readyToTrain`      | The session, and what is in it      | Yes                            |
| `restDay`           | Nothing scheduled, next one is …    | Yes — "train it today instead" |

## The habit checklist

Five rows: three ticks and two numbers. It lives here rather than on a tab of its own
because it is answered in passing, and a habit that needs navigating to is a habit that gets
skipped. The bottom navigation is still four items — see `BottomNavigation.tsx`.

Three rules are worth knowing before changing it:

- **An untouched day is not a failed day.** The three ticks default to `false` in storage, so
  a day nobody opened looks identical to a day where nothing went right.
  `hasAnythingRecorded` is what separates them, and it is why the panel opens saying
  "Nothing ticked yet today" rather than "0 of 5".
- **A day is judged against the target that was in force on it.** The step target climbs
  from 5,000 to 9,000 across the twelve weeks, so `HabitDay` carries its own target and the
  history is not re-judged every time the ramp steps up.
- **Ticks save optimistically; typed numbers do not save themselves.** A checkbox that waits
  for a round trip gets pressed twice, so it moves first and rolls back if the write fails. A
  number gets a confirm button instead, because an 8 on the way to 8,200 must never be
  recorded as eight steps.

## Two things it deliberately does not do

- **It never shows a weight it decided.** Every prescribed number is worked out when the
  session opens, against history read at that moment. A weight shown here would be a second
  opinion, and two opinions about what goes on the bar is one too many. It lists movements
  instead. The weigh-in panel does show a weight, but it is the one he just typed.
- **It never writes anything he did not ask it to.** No assignment is created because
  somebody opened the app — that is the session player's job, at the moment a session
  actually starts. See the note at the top of `useTrainingOverview.ts`. Every write from this
  screen is a tick, a number or a weigh-in.

## Why `useTodayTracking` is separate from `useTrainingOverview`

`useTrainingOverview` is shared with the Schedule screen. Neither the checklist nor the scale
appears there, so folding these reads into it would make every screen in the app pay for them
on launch. The two reads it does make happen together, in one `Promise.all`, so the checklist
and the weigh-in appear at the same moment rather than one at a time.

## Still to come

The full rest-day offer — every mobility movement with its volume, next to the step target —
is "rest-day suggestions" on the roadmap. `RestDayMobilityNote` is the half of it that stops
a rest day being an empty screen.
