# Exercise media tools

Build-time tools that draw and check the exercise animations in
`public/exercise-media/`. Nothing here ships — the app renders committed SVG files and does
not know how they were produced.

The rules these enforce are written down in
[docs/EXERCISE_MEDIA_SPEC.md](../../docs/EXERCISE_MEDIA_SPEC.md). Read that first. This file
only covers the scripts.

## The three files

| File                        | Does                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `exerciseMediaContract.mjs` | The machine-readable half of the specification, plus the code that reads the training content |
| `validateExerciseSvg.mjs`   | Checks a file against the contract. Runs in CI, in `npm run verify`, and inside the generator |
| `generateExerciseSvg.mjs`   | Asks the codex CLI for a drawing, and only writes it if the validator accepts it              |

## Running them

```bash
npm run media:validate                 # check every committed animation
npm run media:validate legExtension    # check one
npm run media:generate -- --all        # draw everything that has no file yet
npm run media:generate legExtension --overwrite
```

`npm run verify` validates every committed file too, so a hand-edited animation that breaks
the contract fails before it can be committed.

## How these read the training content

They import the content's TypeScript directly. Node strips the types, and the grouped
content files (`lowerBodyExercises.ts` and the rest) import nothing but types, so there is no
build step and no duplicated copy of the exercise list to fall out of date.

The **aggregating** modules — `allExercises.ts`, `twelveWeekFoundationProgram.ts` — are
deliberately not used. Their relative imports have no file extension, which Vite resolves and
Node's ESM loader does not. The tools read the grouped files directly instead, picking them
up by listing the directory, so a new group file is included without anyone remembering to
come back here.

## Why the generator never writes a bad file

The specification's section 7 describes the loop, but the short version: it validates in
memory and writes only on success, then retries with the validator's complaints appended to
the prompt. Three attempts, then it reports the failure and moves on. A broken asset never
exists on disk, not even for a moment, so there is nothing to clean up after a bad run.

`codex exec` is run with `--sandbox read-only` in a temporary directory, so a generation run
cannot touch the repository whatever the model decides to do.

## If codex is not available

Nothing here is required to build or run the app. Hand-written SVG that passes the validator
is perfectly acceptable — the exemplar itself was drawn by hand. See section 10 of the
specification.
