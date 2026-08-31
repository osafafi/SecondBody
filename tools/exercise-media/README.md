# Exercise media tools

Build-time tools that copy the exercise animations into `public/exercise-media/` and check
that they still agree with the table that describes them. Nothing here ships — the app
renders committed GIFs and does not know how they got there.

The reasoning behind all of this is in
[docs/EXERCISE_MEDIA_SPEC.md](../../docs/EXERCISE_MEDIA_SPEC.md). Read that first,
especially section 2, which is about the licence. This file only covers the scripts.

## The three files

| File                       | Does                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `exerciseMediaDataset.mjs` | Paths, and reading the two things both tools need: the clone, and the committed table |
| `copyDatasetGifs.mjs`      | Copies matched animations out of the clone. The only thing that touches `vendor/`     |
| `verifyExerciseMedia.mjs`  | Proves the table and the committed files say the same thing. Needs no clone           |

## Running them

```bash
npm run media:copy                  # copy everything the match table names
npm run media:copy legExtension     # copy one
npm run media:verify                # check the committed files against the table
```

`npm run verify` runs the same checks through `verifyExerciseMedia.test.mjs`, so a table
edited without copying the file — or a file committed without a table row — fails before it
can be committed.

## The clone

`copyDatasetGifs.mjs` reads from `vendor/exercises-dataset`, which is gitignored and has to
be created once per machine:

```bash
git clone --depth 1 https://github.com/hasaneyldrm/exercises-dataset.git vendor/exercises-dataset
```

It is 296 MB, and 269 MB of that is animations this project does not use. That is the whole
reason it is not a submodule: the ~30 files that matter are copied out and committed, and
nothing afterwards — not the app, not the tests, not CI — needs the other 1297.

If the clone is missing, `media:copy` says so and prints the command. `media:verify` does not
care, because it never looks.

## Why the copier checks the name

The match table records the dataset's own name for each record it points at. Before copying,
the tool checks the record still has that name, and refuses to write anything if it does not.

The failure this prevents is specific and quiet: the dataset is re-cloned, its ids have
shifted by a row, and a squat is copied over a deadlift under a filename that still looks
right. Nothing downstream would catch it. Somebody would find out in a gym.

## How these read the training content

They import the content's TypeScript directly. Node strips the types, and the content files
they reach for import nothing but types, so there is no build step and no duplicated copy of
the exercise list to fall out of date.

The **aggregating** modules — `allExercises.ts`, `allExerciseMedia.ts` — are deliberately not
used. Their relative imports have no file extension, which Vite resolves and Node's ESM
loader does not. The tools read the grouped files directly instead, picking them up by
listing the directory, so a new group file is included without anyone remembering to come
back here.

## What was here before

`generateExerciseSvg.mjs`, `validateExerciseSvg.mjs` and `exerciseMediaContract.mjs`, which
asked the codex CLI to draw animated SVGs and checked them against a written contract. They
worked. The drawings were not good enough to learn a movement from, so the media is sourced
rather than generated now, and all three are gone. The history is in
`feat/exercise-media-pipeline`.
