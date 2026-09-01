# Schedule

The training calendar: which sessions are done, which are planned, which were missed, and
where the twelve weeks have got to.

**Status:** built in **M6**, extended by **F3** and **F4** with month headings and a day view.

## The four panels

| Panel                  | What it is for                                                                   |
| ---------------------- | -------------------------------------------------------------------------------- |
| `ProgramProgressPanel` | Week N of 12, the three phases, and a bar measured in sessions rather than weeks |
| `TrainingCalendarGrid` | Seven weeks of days, from `buildTrainingCalendar`                                |
| `UpcomingSessionsList` | The next five training days and what each one is                                 |
| `RecoveryRailPanel`    | The 48-hour rail, stated in full                                                 |

## The day view

`SessionDetailScreen` at `/schedule/day/:isoDate`, reached by tapping a day in the grid or a
row in "Coming up". It shows one of four things: a session that happened, a session left
unfinished, a session that is planned, or an honest account of why a day has nothing behind
it.

**It is addressed by date, not by session id.** Half of what it shows has no session document
— a future Friday exists only as a projection out of `buildTrainingCalendar`.

**It rebuilds the same calendar the grid did**, from the constants exported by
`src/domain/trainingCalendar.ts`. That is load-bearing rather than lazy: the A / B / C
projection is a running cycle, so a different window would hand out different letters and the
grid would show a B on Friday while the day view opened a C.

Two things it deliberately does not do:

- **No weights on a planned day.** Every number that goes on a bar is decided by
  `resolveSessionPlan` when the session opens, against history read at that moment. One shown
  a day early is a guess that has already changed. There is a test that fails if a kilogram
  figure ever appears there.
- **No way to start a session.** Reading what is on Friday is not doing it. Today owns the way
  into the player because Today is the screen that knows about the 48-hour rail, and a second
  door would be a second place to get that rail wrong.

## Why the calendar says which month it is

The grid is a rolling window of weeks rather than a month, so without a heading it is a field
of numbers between 1 and 31 with nothing naming them. Each row carries a heading, drawn only
when the month turns over.

A row of seven days can straddle two months. `describeWeekMonth` gives it to whichever month
holds most of it, by reading the **median** day — for an odd-length row that is always the
majority month. Reading the row's first day instead would file Monday 31 August to Sunday 6
September under August, putting the heading a week out for the first six days of every month.

## Why the recovery panel exists

The rail from [TRAINING_PROGRAM.md](../../../docs/TRAINING_PROGRAM.md) section 12 — never two
strength sessions less than 48 hours apart — is enforced everywhere else in the app by a
button simply not being there. This is the one place it is **explained**, because a rule that
only ever appears as a missing button gets read as a bug.

It is shown whether or not the rail is currently holding anything back. "You are clear" is as
much a fact as "eleven hours to go", and a panel that appeared only when something was
blocked would make the rail feel like a punishment.

## The letters on future days are a projection

The A / B / C cycle moves when a session is **completed**, not when a weekday passes. Miss a
Wednesday and Friday trains what Wednesday would have, with everything after it shifting back
by a day rather than being skipped. `buildTrainingCalendar` walks the planned days in order
handing out letters from that cycle, which is why the grid is built by a tested domain
function rather than by a loop in a component.

A **missed** day never gets a letter. We know a session did not happen; we do not know which
one it would have been, because the cycle had not moved on.

## Shared with Today

Both screens read through `useTrainingOverview` in `src/hooks/`. Features may not import from
each other, and — more to the point — two screens working out the current week separately is
how they end up disagreeing about it.
