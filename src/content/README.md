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
  exerciseMedia/ Which dataset animation belongs to which exercise, and why. See
                docs/EXERCISE_MEDIA_SPEC.md before touching this.
  programs/     The twelve week programme: phases, weeks, and three sessions per phase.
  mobility/     The at-home "Desk Undo" routine.
  habits/       The daily checklist and its targets.
  equipment/    Equipment ids turned into words. This is the real inventory of
                Omar's building gym, not a catalogue of what a gym might have.
  vocabulary/   The rest of the shared ids turned into words: pain areas, days of
                the week. Here rather than in a feature because onboarding asks
                these questions and Settings asks them again.
  coachVoice/   Everything Harout says.
  coaching/     The facts a coaching bundle needs from this folder, gathered once so
                the two export callers cannot resolve them differently.
```

## How it fits together

Everything references exercises by `exerciseId` rather than embedding them. A programme slot,
a warm-up step and a mobility step all hold an id, so:

- A form cue is corrected in one place and is corrected everywhere.
- Cat-cow appearing in both the gym warm-up and the home routine is one definition, not two
  that drift apart.
- An exercise's logged history survives the programme that first prescribed it.
- The animation filename is the id — `public/exercise-media/{exerciseId}.gif` — so nothing
  has to be looked up at render time beyond whether the file exists at all.

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
machine and the overhead press do not appear before Phase 2 or 3. Change one of those in
content without changing it in the document and a test tells you.

`allExercises.test.ts` also proves every exercise only asks for equipment that is in
`equipment/gymEquipment.ts`, which is the list of what is actually in the building. That is
what stops a session prescribing a machine that is not there.

### Not everything here is prescribed

Most exercises are in the twelve week programme. Three are not, and that is deliberate:

| Exercise                  | Why it is defined anyway                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `seatedHipAdduction`      | The adductor machine exists in the gym. It is a substitute for the days a lunge is a bad idea |
| `ellipticalEasy`          | The elliptical exists in the gym. It is the swap when the treadmill is taken                  |
| `barbellRomanianDeadlift` | Written and ready for the day there is a rack to lift a bar out of at hip height. See Phase 3 |

Each one is reachable through some prescribed exercise's `substituteExerciseIds`, so none of
it is dead content.

## Adding to it

| Adding         | Where                                                         | Also do                                                         |
| -------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| An exercise    | The matching `exercises/*.ts` group                           | Write a `mediaBrief`, then find it an animation. See below      |
| A programme    | A folder under `programs/`, then register it                  | Every slot's `exerciseId` must resolve                          |
| A coach line   | The matching `coachVoice/*.ts` file                           | Id must be prefixed with its category. Mark `isPraise` honestly |
| A piece of kit | `equipment/gymEquipment.ts` and `EquipmentId` in `src/types/` | -                                                               |

### Finding an exercise an animation

Every exercise must appear in exactly one of the two lists in
`exerciseMedia/exerciseMediaMatches.ts`: matched to a dataset animation, or given a written
reason there is none. The verifier fails the build if one is in neither, so an exercise
cannot quietly lose its preview. [docs/EXERCISE_MEDIA_SPEC.md](../../docs/EXERCISE_MEDIA_SPEC.md)
section 6 is the procedure.
