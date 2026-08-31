# Dashboard (the Today screen)

The screen the app opens on. It answers one question — **what is on today** — and gives the
way into it.

**Status:** built in **M6**.

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

## Two things it deliberately does not do

- **It never shows a weight.** Every number is prescribed when the session opens, against
  history read at that moment. A weight shown here would be a second opinion, and two
  opinions about what goes on the bar is one too many. It lists movements instead.
- **It never writes anything.** No assignment is created because somebody opened the app —
  that is the session player's job, at the moment a session actually starts. See the note at
  the top of `useTrainingOverview.ts`.

## Still to come

The habit checklist and the quick weight log are **M8**, and there is a `ComingSoonPanel`
holding their place. The full rest-day offer — every mobility movement with its volume, next
to the step target — is "rest-day suggestions" on the roadmap; `RestDayMobilityNote` is the
half of it that stops a rest day being an empty screen.
