# Onboarding

The five questions asked once, the first time somebody signs in.

Everything the programme prescribes is derived from these answers, so they are collected
before the app opens rather than left to a settings screen nobody visits.

## What is built

- **`OnboardingFlow`** - the whole thing. Five steps, a progress bar, back and next, and one
  write at the end.
- **`OnboardingNumberField`** - a number question. Exists because `Number('')` is `0`, so
  the obvious `<input type="number">` silently turns a blank height into a height of zero.
- **`OnboardingChoiceGrid`** - the multi-select chips used for pain areas, equipment and
  training days. Real checkboxes in a fieldset, visually hidden, with the label drawn as the
  chip - so keyboard operation and "checked" announcements come from the browser.

## The steps

| Step            | Asks                      | Notes                                     |
| --------------- | ------------------------- | ----------------------------------------- |
| `aboutYou`      | Name, birth year, height  | Name is prefilled from the Google account |
| `startingPoint` | Weight now, weight wanted | Direction is not checked - see below      |
| `painAreas`     | Anything that hurts       | Empty is a valid, and hoped-for, answer   |
| `equipment`     | What the gym has          | Starts fully ticked - see below           |
| `schedule`      | Which days                | Defaults to Monday / Wednesday / Friday   |

## Decisions worth knowing

**Validation is not in this folder.** It lives in `src/domain/onboardingValidation.ts`, so
the rules about a plausible height and a non-empty gym are unit tested rather than only
exercised by clicking through a form. That module takes the current year as an argument
because `src/domain/` is not allowed to read a clock.

**The equipment step starts with everything ticked.** The inventory in
`src/content/equipment/gymEquipment.ts` was counted in Omar's building gym in person, so
"all of it" is the correct answer for him. Unticking what a different gym lacks is less work
than ticking twenty-six boxes.

**A target weight above the current weight is allowed.** Body recomposition can mean the
scale going up, down or nowhere. Insisting the target be lower would be the app assuming a
goal it was never told about.

**Problems only appear after a first attempt to move on.** Complaining about an empty field
before it has been reached is a form telling someone off for not having answered yet.

## Editing it afterwards

M8 added that to the settings screen. Five of the eight fields can be changed there — name,
height, target weight, training days and pain areas — and `src/domain/profileEditing.ts`
explains why the other three cannot. The plausibility bounds are shared with this form rather
than restated, so the two cannot disagree about a believable height.

`excludedExerciseIds` is written as an empty array here and has no question - it is for
something a physio ruled out, which is a conversation rather than a checkbox, and it is not
editable in Settings either.

The chip grid and the number field this form is built from now live in `src/components/`,
because Settings asks three of the same questions. They moved in M8.
