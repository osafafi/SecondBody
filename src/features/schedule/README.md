# Schedule

The training calendar: which sessions are done, which are planned, which were missed, and
where the twelve weeks have got to.

**Status:** built in **M6**.

## The four panels

| Panel                  | What it is for                                                                   |
| ---------------------- | -------------------------------------------------------------------------------- |
| `ProgramProgressPanel` | Week N of 12, the three phases, and a bar measured in sessions rather than weeks |
| `TrainingCalendarGrid` | Five weeks of days, from `buildTrainingCalendar`                                 |
| `UpcomingSessionsList` | The next three training days and what each one is                                |
| `RecoveryRailPanel`    | The 48-hour rail, stated in full                                                 |

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
