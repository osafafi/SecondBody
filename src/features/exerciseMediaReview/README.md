# Exercise media review

A contact sheet of every exercise animation. **This is a development tool, not a screen of
the app.**

Reach it at `#/exercise-media` while `npm run dev` is running. It is registered behind
`import.meta.env.DEV` in `src/app/App.tsx`, so the route and this whole folder are removed
from the production bundle.

## Why it exists

`tools/exercise-media/validateExerciseSvg.mjs` proves an animation satisfies the contract.
It cannot prove the animation is any _good_ — that the knee bends the right way, that the
glowing muscle is the one being trained, that the thing is legible at the size a phone
actually draws it. [EXERCISE_MEDIA_SPEC.md](../../../docs/EXERCISE_MEDIA_SPEC.md) section 9
lists those checks, and they are a person's job.

Doing that job across three dozen files by opening three dozen files is how it stops getting
done. So they are all here, on one page, at both sizes, with the palette switcher beside
them.

## What to look for

- The movement matches the exercise, at both ends of the rep.
- The right muscle glows. A wrong one teaches wrong information.
- It reads at 160 px, which is the size it is used at.
- It survives a palette change. Anything that does not move when you press Emerald Teal has
  a hard-coded colour in it, which the validator should have caught.

An exercise with no file yet shows its muscle group's icon instead. That is the same
fallback the real app uses, so a gap here is a gap the user would see, not a broken page.

## Notes

This screen sits **outside** `AppShell`, unlike every real screen, because it needs the full
width of the window. It is the only place in the codebase that is allowed to lay out wider
than a phone.
