# Settings

Everything the user can change about the app itself.

## What is built

- **`ColorPalettePicker`** - fully working. Lists every palette from
  `src/theme/palettes/availableColorPalettes.ts`, applies the choice to the document
  immediately, and remembers it. Adding a palette makes it appear here with no change to
  this feature.

## What is not built yet

- Profile editing, weight targets, training days, pain areas, coach verbosity (M8).
  These need somewhere to persist, so they wait for the Firebase data layer in M4.

## Notes

The palette preference is currently stored in `localStorage` by
`src/theme/colorPalettePreferenceStorage.ts`. M4 moves it into the user's Firestore
`settings/current` document so it follows him between devices, keeping localStorage as a
fast-path cache to avoid a colour flash on load.
