# Exercise media review

A contact sheet of every exercise animation. **This is a development tool, not a screen of
the app.**

Reach it at `#/exercise-media` while `npm run dev` is running. It is registered behind
`import.meta.env.DEV` in `src/app/App.tsx`, so the route and this whole folder are removed
from the production bundle.

## Why it exists

`tools/exercise-media/verifyExerciseMedia.mjs` proves that every exercise has either an
animation or a written reason it does not, and that every committed file is one something
actually asks for. It cannot prove that the animation is _of the right exercise_ — the
matching is done by a person looking at pictures, and this is where that looking happens.
[EXERCISE_MEDIA_SPEC.md](../../../docs/EXERCISE_MEDIA_SPEC.md) sections 4 and 8 are the
rules; this screen is the place they are applied.

Doing that job across three dozen files by opening three dozen files is how it stops getting
done. So they are all here, on one page, at both sizes, with the palette switcher beside
them.

## What to look for

- **The movement matches the exercise, at both ends of the rep.** This is the whole point.
  27 of the 36 are matched to an open dataset rather than drawn for this app, and eight of
  those 27 are marked `close` — same movement, something visibly different. If a `close`
  match turns out to teach the wrong thing, demote it to `exercisesWithoutMediaMatch` rather
  than keeping it because it is better than nothing.
- **The eight generated ones sit beside the dataset ones without looking borrowed.** They
  were drawn for this app in the dataset's style, so this page is where you find out whether
  that holds at 160 px next to the real thing.
- **It reads at 160 px**, which is the size it is used at.
- **The inversion has not made a mess of it.** The source files are dark line art on white
  and the app inverts them; a machine with dark pads comes out with bright blocks in it.
- **The one remaining fallback says "No preview yet"** rather than showing something wrong.
  It is listed in `src/content/exerciseMedia/exerciseMediaMatches.ts` with the reason.

The palette switcher no longer changes the animations themselves — they are raster. It still
changes everything around them, which is worth a glance.

## Notes

This screen sits **outside** `AppShell`, unlike every real screen, because it needs the full
width of the window. It is the only place in the codebase that is allowed to lay out wider
than a phone.
