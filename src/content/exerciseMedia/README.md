# `src/content/exerciseMedia/`

Which animation belongs to which exercise, and why.

The animations themselves are `.gif` files in `public/exercise-media/`. Most were copied out
of an open dataset — **those are not this project's property** — and eight were generated for
this app, for movements the dataset had nothing honest for. Every row says which it is. Read
[docs/EXERCISE_MEDIA_SPEC.md](../../../docs/EXERCISE_MEDIA_SPEC.md), especially section 2,
before adding, moving or publishing any of them.

## The files

| File                          | What it is                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `exerciseMediaMatches.ts`     | **The reviewable one.** 35 animations and 1 written refusal, with the reasoning     |
| `exerciseMediaTypes.ts`       | What a row is: the two sources, and the two quality verdicts a dataset one has      |
| `allExerciseMedia.ts`         | The lookup index the app reads. `exerciseMediaMatches.ts` is the readable unit      |
| `exerciseMediaAttribution.ts` | The copyright notice on the dataset files. In Settings, because the licence says so |

## Why the table is committed rather than computed

Matching 36 exercises against 1324 dataset records is a judgement, not a calculation. The
dataset contains `biceps leg concentration curl`; any fuzzy matcher hands that straight to
`seatedLegCurl` and nobody notices until a gym.

So each row was chosen by opening the dataset's thumbnail and looking at the picture. That
judgement is made once and committed, where a pull request can argue with it — which is the
same reason every other file in `src/content/` is here.

## Why one exercise has no animation

Because a wrong animation is worse than no animation. Nine exercises had nothing in the
dataset that showed the movement they describe. Eight of them now have an animation generated
for this app; the ninth, the 90/90 hip switch, renders **"No preview yet"** rather than the
nearest-looking stretch. That is visible, honest and fixable; a confidently wrong drawing is
none of those.

The refusal records what was searched for and what the nearest miss was, so nobody has to
repeat the search to find out it was already done.

## The rule the verifier enforces

Every exercise appears in exactly one of the two lists. Not both, and never neither — an
exercise that fell through the gap would silently lose its preview, and the whole point of
the second list is that a missing preview is always a decision somebody made and wrote down.
