# `src/content/`

Static training data: exercises, the programme, mobility routines, habits and Harout's
lines.

**This is content, not user data.** It lives in git because it should be reviewed in pull
requests, versioned and diffable. Changing the programme is a code change with a readable
diff, which is the whole point.

Nothing personal ever goes in here. Body weight, measurements, logged sessions and habit
ticks live in Firestore. See [docs/DATA_MODEL.md](../../docs/DATA_MODEL.md).

## Layout

```
content/
  exercises/    One file per group of related movements, plus a flat registry.
  programs/     The twelve week programme: phases, weeks, and three sessions per phase.
  mobility/     The at-home "Desk Undo" routine.
  habits/       The daily checklist and its targets.
  equipment/    Equipment ids turned into words.
  coachVoice/   Everything Harout says.
```

## How it fits together

Everything references exercises by `exerciseId` rather than embedding them. A programme slot,
a warm-up step and a mobility step all hold an id, so:

- A form cue is corrected in one place and is corrected everywhere.
- Cat-cow appearing in both the gym warm-up and the home routine is one definition, not two
  that drift apart.
- An exercise's logged history survives the programme that first prescribed it.
- The animation filename is the id — `public/exercise-media/{exerciseId}.svg` — so the media
  pipeline in M3 needs no separate mapping.

The registries (`allExercises.ts`, `allProgramTemplates.ts`, `allCoachLines.ts`,
`allMobilityRoutines.ts`) are the only things the rest of the app imports.

## The integrity tests are the safety net

`allExercises.test.ts`, `allProgramTemplates.test.ts` and `allCoachLines.test.ts` are not
testing behaviour. They are proving the content is internally consistent, because the failure
modes here — a slot pointing at an exercise that does not exist, a rep range with its ends the
wrong way round, a phase that quietly skips week 7 — are all invisible until someone is
standing in front of a machine.

They also pin the decisions in [docs/TRAINING_PROGRAM.md](../../docs/TRAINING_PROGRAM.md):
week 8 is the deload, week 1 is calibration, the core work never flexes the spine, the rowing
machine does not appear before Phase 3. Change one of those in content without changing it in
the document and a test tells you.

## Adding to it

| Adding         | Where                                                         | Also do                                                         |
| -------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| An exercise    | The matching `exercises/*.ts` group                           | Write a `mediaBrief`, then generate its SVG (M3)                |
| A programme    | A folder under `programs/`, then register it                  | Every slot's `exerciseId` must resolve                          |
| A coach line   | The matching `coachVoice/*.ts` file                           | Id must be prefixed with its category. Mark `isPraise` honestly |
| A piece of kit | `equipment/gymEquipment.ts` and `EquipmentId` in `src/types/` | -                                                               |
