# Exercise Media Specification

Where the exercise animations come from, how each one was chosen, and what has to be true
before one is committed.

---

## 1. What the animations are

180×180 looping GIFs, from two places.

**27 are copied from the open
[`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset)
collection**: 1324 anatomical line-art animations, of which 27 are used here. **They belong
to Gym Visual, not to this project.** Read
[section 2](#2-the-licence-and-why-it-is-in-this-document) before adding, moving or
publishing any of them.

**8 were generated for this app**, in the same 180×180 line-art style, for movements the
dataset had nothing honest to offer — the rowing ergometer and seven of the warm-up drills.
Those are this project's own files. Each row in the match table says which of the two it is
in its `mediaSource` field, because who owns a file follows from that and nothing else.

### Why not the generated SVGs

M3 originally generated an animated SVG per exercise with the codex CLI — palette-reactive,
5 KB each, reviewable as text in a diff. Every one of those properties was real. The problem
was the only one that mattered: **they did not look good enough to learn a movement from.**
An animation whose job is to show someone what a Romanian deadlift is has failed if the
person has to already know.

The trade was made knowingly, and this is what it cost:

|                             | Generated SVG (was) | Dataset GIF (is)                 |
| --------------------------- | ------------------- | -------------------------------- |
| Actually legible as a human | No                  | **Yes**                          |
| File size                   | ~5 KB               | ~90 KB (3.0 MB across all 35)    |
| Sharp at any size           | Yes                 | No — fixed at 180×180            |
| Recolours with the palette  | Yes                 | No, they are raster              |
| Reviewable in a diff        | Yes, it is text     | No — the match table is instead  |
| Coverage                    | All 36              | 35 of 36                         |
| Licensing                   | Ours                | **27 someone else's.** Section 2 |

The palette point is the one that was actively lost. It is partly bought back in CSS: the
app inverts the images, so their white ground becomes the panel's black and the figures
read as light-on-dark like everything else. See
`src/components/ExerciseAnimation/ExerciseAnimation.module.css`.

## 2. The licence, and why it is in this document

The dataset's own [NOTICE](https://github.com/hasaneyldrm/exercises-dataset/blob/main/NOTICE.md)
splits its licensing in two. MIT covers the code, the structure and the instruction text. It
explicitly **does not** cover the media, which is Gym Visual's property, redistributed there
with separate written permission on two conditions:

1. **180×180 only.** Nothing in this pipeline resizes or re-encodes anything — files are
   copied byte for byte. The copying tool also refuses anything far heavier than a 180×180
   animation should be, so a dataset that started shipping larger media would stop the tool
   rather than quietly put this project outside the terms.
2. **The notice travels with the media.** `© Gym visual — https://gymvisual.com/`. It lives
   in `src/content/exerciseMedia/exerciseMediaAttribution.ts`, is rendered in Settings, and
   is repeated in `public/exercise-media/ATTRIBUTION.md` next to the files themselves.

The notice is also explicit that cloning the dataset is not itself a licence, and points
anyone using the media at [Gym Visual's
terms](https://gymvisual.com/content/3-terms-and-conditions-of-use).

**This repository is public, so committing these files is redistribution.** That is Omar's
call to make, and it is written down here and in `ATTRIBUTION.md` so that it stays a
decision rather than becoming an assumption.

## 3. The pieces

| Piece                                               | What it is                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `vendor/exercises-dataset/`                         | The clone. Gitignored, 296 MB, needed only to copy files out of                 |
| `src/content/exerciseMedia/exerciseMediaMatches.ts` | **The reviewable artefact.** Which animation belongs to which exercise, and why |
| `tools/exercise-media/copyDatasetGifs.mjs`          | Copies matched files out of the clone into `public/exercise-media/`             |
| `tools/exercise-media/verifyExerciseMedia.mjs`      | Proves the table and the committed files agree. Runs in CI                      |
| `public/exercise-media/{exerciseId}.gif`            | What the app serves                                                             |
| `src/components/ExerciseAnimation/`                 | What draws it, and the "No preview yet" fallback                                |

The clone is recreated with:

```bash
git clone --depth 1 https://github.com/hasaneyldrm/exercises-dataset.git vendor/exercises-dataset
```

Nothing except `copyDatasetGifs.mjs` needs it. The app, the tests and CI read only what is
committed.

## 4. The matching rule

**An animation must not teach anything false.**

That is the whole rule, and it is stricter than "is it close enough". It divides candidates
in three:

| Verdict  | Means                                                        | Example                                                                         |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `exact`  | Same movement, same equipment                                | `legExtension` → `lever leg extension`                                          |
| `close`  | Same movement, something visibly different                   | `pallofPress` → `band horizontal pallof press`. A band, not the cable station   |
| No match | A different movement, however similar the name or the target | `ninetyNinetyHipSwitch`. The dataset's seated hip work is all static stretching |

A `close` match carries a written sentence saying what differs. That sentence is the only
thing that makes the compromise reviewable, so the verifier rejects a `close` match without
one.

A no-match is not a failure to be hidden. It renders as **"No preview yet"** in the app,
which is visible, honest, and fixable. A wrong animation is none of those: it is silently
confident, and someone learns the wrong movement from it in a gym.

An animation generated for this app is held to the same rule and checked the same way, by
looking at the frames against the brief. What it does not have is a dataset record to be
checked against, so its row carries a sentence saying what the frames show instead — see
section 9.

### Matches are chosen by eye, not by string

Every row in the table was chosen by opening the dataset's own 180×180 thumbnail for the
candidate and checking the picture against the exercise's `mediaBrief`. Name similarity is
how candidates are found, never how they are accepted — the dataset contains
`biceps leg concentration curl`, which any fuzzy matcher would happily hand to
`seatedLegCurl`.

## 5. File naming

`public/exercise-media/{exerciseId}.gif`, where `exerciseId` is the camelCase id from
`src/content/exercises/`.

```
public/exercise-media/legExtension.gif
public/exercise-media/dumbbellRomanianDeadlift.gif
```

The id never changes once sessions have been logged against it — see
`src/types/exerciseTypes.ts`.

Two exercises may point at the same dataset record, in which case the file is copied twice
under both names. `gobletSquat` and `gobletSquatToBox` do exactly that. The alternative is a
lookup indirection in the served files, which would buy 67 KB and cost the property that the
file name is the exercise id.

## 6. Adding or changing a match

```bash
# 1. Clone the dataset, if you have not already (see section 3).
# 2. Find candidates. The dataset's data/exercises.json is a flat array of
#    { id, name, equipment, target, body_part, image, gif_url }.
# 3. LOOK AT vendor/exercises-dataset/images/{id}-{media_id}.jpg for each candidate.
# 4. Add the row to src/content/exerciseMedia/exerciseMediaMatches.ts.

npm run media:copy legExtension    # copy one
npm run media:copy                 # copy everything the table names
npm run media:verify               # prove the table and the files agree
```

Step 3 is not optional and cannot be delegated to the name. It is the entire quality control
of this pipeline.

`media:copy` refuses to write a file whose dataset record no longer carries the name the
match table recorded for it. If the dataset is re-cloned and its ids have shifted, that check
is what stops a squat being copied over a deadlift because a row number moved.

### Adding a generated animation

Two steps rather than three, because there is nothing to copy: put the `.gif` in
`public/exercise-media/{exerciseId}.gif` yourself, and add a row with
`mediaSource: 'generatedForThisApp'` and a `whatTheAnimationShows` sentence. `media:copy`
skips these rows entirely and says so if asked for one by name. `media:verify` treats them
like any other row: the file has to be there, and nothing else may be.

## 7. What the verifier checks

`npm run media:verify`, and the same checks in
`tools/exercise-media/verifyExerciseMedia.test.mjs`, so `npm run verify` catches them too:

- Every exercise is either matched or has a written reason it is not. No exercise can fall
  through the gap and silently lose its preview.
- Every match has its file committed.
- Every committed file is asked for by a match. Nothing is served to nobody.
- No exercise is in both lists.
- Every `close` match explains itself.
- Every generated animation says what its frames show, which is the only thing standing in
  for a dataset record somebody could go and look at.
- Nothing that is not an animation is sitting in `public/exercise-media/`, which the app
  serves wholesale. (`ATTRIBUTION.md` is the one allowed exception, and it is required to be
  there.)

## 8. Reviewing the animations

Run the dev server and open `#/exercise-media`. It is a contact sheet of all 36 at both the
size a phone draws them and larger, with the palette switcher beside them.

What to look for, none of which a script can check:

- **The movement matches the exercise, at both ends of the rep.** This is the one that
  matters. A `close` match that turns out to be teaching the wrong thing should be demoted
  to no-match rather than kept because it is better than nothing.
- **It reads at 160 px**, which is the size it is used at.
- **The inversion has not made a mess of it.** Machines with dark pads inside them come out
  as bright blocks. It is a fair trade against a white glare in a dark app, but it is worth
  looking at.

## 9. The gaps the dataset left, and what filled them

Nine exercises had nothing in the dataset that showed the movement they describe:
`rowingMachineEasy`, `catCow`, `wallSlides`, `chinTucks`, `bodyweightHipHinge`,
`threadTheNeedle`, `ninetyNinetyHipSwitch`, `couchStretch`, `doorwayPecStretch`.

Seven of the nine are mobility drills, which is not a coincidence: the dataset is a
strength-training collection, and it is thin on the corrective and positional work that
makes up the warm-up here.

**Eight of the nine are now animations generated for this app**, in the dataset's style so
the contact sheet reads as one set: two frames each — the two ends of the movement — except
the rower, which is four. Each was checked frame by frame against the exercise brief before
it was committed, and its row records what the frames show, since there is no dataset record
to check it against instead.

`ninetyNinetyHipSwitch` is the one still drawing the fallback. Its entry in
`exercisesWithoutMediaMatch` records what was searched for and what the nearest miss was, so
the search does not have to be repeated from scratch.
