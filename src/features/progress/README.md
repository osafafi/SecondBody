# Progress

Proof that the programme is working: body weight as a 7-day rolling average, training volume
over time, and personal records.

**Status:** built in **M7**.

## The one design constraint that outranks the others

The raw daily scale reading is misleading and demoralising in the first three weeks, because
new training pulls water and glycogen into muscle. **The screen leads with the rolling
average.** The raw readings are drawn as faint dots behind the line, never as the headline
number, and for the first three weeks the screen refuses to draw a verdict at all — it says
so instead. See [TRAINING_PROGRAM.md](../../../docs/TRAINING_PROGRAM.md) section 11.

## What decides what

Nothing in this folder decides anything about training. It arranges what the domain returns.

| Question                            | Answered by                                            |
| ----------------------------------- | ------------------------------------------------------ |
| What is the scale actually doing?   | `domain/bodyWeightTrend.ts`                            |
| Where should the weight be by now?  | `domain/bodyWeightExpectations.ts`                     |
| How much work, week by week?        | `domain/trainingVolumeTrend.ts`                        |
| Was that lift the best it has been? | `domain/personalRecordProgress.ts`                     |
| How does any of that read?          | `progressWording.ts` — labels, with runtime numbers in |
| What does Harout say about it?      | `progressCoachLines.ts` — one moment only, see below   |

`progressWording.ts` is not coach copy. Every sentence in it contains a number that only
exists at runtime, so none of them could be written in advance in
`src/content/coachVoice/`. It still follows the voice's rules: state the fact, do not
moralise, and never dress a bad trend up as a good one — which is why losing weight faster
than planned is reported as a risk to muscle rather than as a win.

The one genuine coach moment here is the first three weeks of the scale not moving, which is
the existing `earlyScaleReassurance` category. **No praise is spent on this screen.** Opening
a chart is not an achievement.

## Where the data comes from

- `useTrainingOverview` (shared with Today and Schedule) for the assignment and the sessions.
- `useProgressHistory` (feature-local) for the weigh-ins and the records. Deliberately not
  folded into the shared hook: Today and Schedule open on every launch and neither shows a
  weigh-in, so adding two Firestore reads to the cold start would be the wrong trade.

## Two things M7 added outside this folder

- **Personal records are now written.** `personalRecordsRepository` had no caller before M7.
  `recordPersonalRecordsFromFinishedSession` in `features/activeSession/useActiveSessionStore.ts`
  runs the comparison once, at the end of a session. Only weight-and-reps movements are
  eligible — a carry stores metres in `actualReps` and Epley on that is a confident,
  meaningless number.
- **Weight can be logged here.** `LogBodyWeightPanel` is the first caller of
  `addBodyMetricEntry`. The quick log on the Today screen is still M8's; this is the
  deliberate version, on the screen where the number is being looked at anyway. A trend with
  no way to add a reading is a chart of an empty collection.
