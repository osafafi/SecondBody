# The app icon

The icon is **generated from code**, not drawn in an editor and committed as a binary blob.

```bash
npm run icons:generate   # redraw public/icons/ from the artwork
npm run icons:verify     # check the committed files still match the artwork
```

---

## Why it is code

The alternative was a native image dependency — `sharp` and its friends carry platform
binaries and a large install — to produce seven small squares that change roughly never.
The same reasoning that made the rest-timer chime two synthesised sine waves rather than a
30 kB audio file applies here.

What it buys, beyond the missing dependency:

- **The icon is reviewable.** A change to it shows up in a pull request as a diff of
  numbers with names, not as "binary file changed".
- **It cannot drift from the palette.** `appIcon.test.mjs` reads
  `src/theme/palettes/purpleBluePalette.ts` and fails if the colours stop matching.
- **The safe zone is a test, not a hope.** Android crops maskable icons to whatever shape
  the launcher likes. There is a test that renders the maskable variant and measures how
  far the mark actually reaches.

## The mark

A three-quarter progress ring with a chevron climbing out of it — the rest timer and the
number going up, which are the two things the app is for and the two shapes already on its
screens the most. The gap in the ring is what stops it reading as the letter O.

The gradients are stated as CSS angles (`135deg` for the brand gradient, `150deg` for the
background) because those are the exact angles the stylesheets use, so the two can be
compared without converting anything.

## The files

| File                   | What reads it                                                         |
| ---------------------- | --------------------------------------------------------------------- |
| `appIconArtwork.mjs`   | The icon itself. **This is the file to edit.**                        |
| `appIconOutputs.mjs`   | Which files get written, at what size, in which variant               |
| `rasteriser.mjs`       | Shapes and gradients in a 0..1 square, super-sampled for smooth edges |
| `pngCodec.mjs`         | A PNG encoder, and enough of a decoder to verify our own output       |
| `generateAppIcons.mjs` | Writes `public/icons/`                                                |
| `verifyAppIcons.mjs`   | Compares `public/icons/` against a fresh render                       |

## Three variants, because three platforms crop differently

| Variant     | Background                    | Mark | Used for                                                                                 |
| ----------- | ----------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| `rounded`   | squircle, transparent corners | 100% | the manifest's `any` icons, and the favicons                                             |
| `fullBleed` | edge to edge                  | 100% | `apple-touch-icon` — iOS masks the corners itself, and renders any transparency as black |
| `maskable`  | edge to edge                  | 76%  | the manifest's `maskable` icons, which Android crops                                     |

## Changing it

1. Edit the numbers in `appIconArtwork.mjs`.
2. `npm run icons:generate`.
3. Look at `public/icons/icon-512.png` **and** `favicon-32.png`. An icon that only works
   at one size is not finished.
4. Commit the regenerated files with the artwork change. `npm run verify` fails if you do
   not, and so does CI.

## Why the verifier compares pixels rather than bytes

zlib's exact output is not guaranteed identical across Node versions, so a byte comparison
would fail the build on a Node upgrade while the icons were in fact unchanged. Decoding
both sides and comparing pixels asks the question that was actually meant.
