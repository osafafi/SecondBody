# Design System

Read this before writing any UI. The visual identity is specific and was requested in
detail — it is not a matter of taste, and drifting from it is a review comment.

---

## 1. The brief, verbatim

> Dark theme only. Modern looking UI. **No flat cards or sections.** Gradient colours for
> everything, transparency, subtle rounded interface. Plenty of icons everywhere.
> Choose a colour palette from the settings menu, so make sure to externalise that.
> Start with a purple-blue palette.

Every rule below exists to serve one of those sentences.

## 2. Non-negotiables

| Rule                                                                           | Why                                          |
| ------------------------------------------------------------------------------ | -------------------------------------------- |
| **Dark only.** There is no light theme, and no `prefers-color-scheme` handling | Requested. Do not add one "for completeness" |
| **Mobile only.** Design at 390 x 844. Do not add desktop breakpoints           | It is used one-handed in a gym               |
| **No flat surfaces.** Every panel is a `GradientSurface`                       | Requested explicitly                         |
| **No hard-coded colours.** Every colour is a CSS custom property               | A literal hex breaks the palette switcher    |
| **Icons are `lucide-react`.** No second icon library                           | Consistency of stroke weight and style       |
| **Touch targets are at least 44 x 44 px**                                      | It is used with sweaty hands, mid-set        |

## 3. The palette contract

A palette is one file in `src/theme/palettes/`. Adding a palette means adding a file and
registering it — nothing else in the app changes.

```ts
export type ColorPaletteDefinition = {
  paletteId: string;
  displayName: string;

  // Primary brand gradient — the app's identity. Used for primary actions and accents.
  brandGradientStart: string;
  brandGradientEnd: string;

  // Secondary gradient — for highlights that must not compete with the primary.
  accentGradientStart: string;
  accentGradientEnd: string;

  // Page backgrounds, darkest to lightest.
  backgroundDeep: string;
  backgroundElevated: string;

  // The tint mixed into translucent surfaces, as bare "r, g, b" for use inside rgba().
  surfaceTintRgb: string;

  // Text.
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Semantic gradients.
  successGradientStart: string;
  successGradientEnd: string;
  warningGradientStart: string;
  warningGradientEnd: string;
  dangerGradientStart: string;
  dangerGradientEnd: string;

  // Exercise illustration colours. The generated SVGs consume these, which is how
  // exercise animations recolour themselves when the palette changes.
  muscleBodyFill: string;
  muscleBodyStroke: string;
  muscleHighlightPrimary: string;
  muscleHighlightSecondary: string;
};
```

`applyColorPaletteToDocument(palette)` writes each field to `:root` as a CSS custom
property using a predictable kebab-case name: `brandGradientStart` becomes
`--brand-gradient-start`.

**Default palette: `purpleBlue`.**

### The bit worth noticing

Because the generated exercise SVGs reference `var(--muscle-highlight-primary)` rather than
literal colours, **switching palette recolours the exercise animations too**. Do not break
this by baking colours into an SVG. See [EXERCISE_MEDIA_SPEC.md](EXERCISE_MEDIA_SPEC.md).

## 4. Surfaces: how "no flat cards" is enforced

Every panel in the app renders through one component, `GradientSurface`. It is the only
place that knows how to draw a surface, so consistency is structural rather than a thing we
have to remember.

| Variant    | Use for                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| `elevated` | The default. Cards, panels, list rows                                      |
| `recessed` | Inset areas — progress tracks, input wells, empty states                   |
| `accent`   | The one thing on screen that matters most. Primary buttons, the active set |
| `glass`    | Overlays: bottom navigation, sheets, the rest-timer overlay                |
| `outlined` | Secondary actions and quiet groupings                                      |

Each variant composes three things, and this is what makes it not look flat:

1. **A layered background** — a linear gradient over a translucent tint, never a solid fill.
2. **A gradient hairline border** — drawn as a masked `::before` pseudo-element, because CSS
   cannot put a gradient on a 1px border directly.
3. **A coloured glow** — box-shadow tinted with the palette hue, not neutral grey. Grey
   shadows are what make a dark UI look cheap.

```css
.surfaceElevated {
  position: relative;
  border-radius: var(--radius-large);
  background:
    linear-gradient(
      150deg,
      rgba(var(--surface-tint-rgb), 0.1),
      rgba(var(--surface-tint-rgb), 0.03)
    ),
    var(--background-elevated);
  backdrop-filter: blur(18px);
  box-shadow: 0 8px 28px -12px rgba(var(--surface-tint-rgb), 0.45);
}

/* Gradient hairline border. */
.surfaceElevated::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.02));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

## 5. Tokens

### Radii — "subtle rounded", so nothing is a pill except pills

| Token             | Value | Use                            |
| ----------------- | ----- | ------------------------------ |
| `--radius-small`  | 10px  | Chips, tags, small controls    |
| `--radius-medium` | 14px  | Buttons, inputs                |
| `--radius-large`  | 20px  | Cards and panels               |
| `--radius-xlarge` | 28px  | Sheets, full-width hero panels |
| `--radius-full`   | 999px | Circular things only           |

### Spacing — a 4px scale

`--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px ·
`--space-5` 24px · `--space-6` 32px · `--space-7` 48px

### Type

| Token            | Size / weight | Use                                                                  |
| ---------------- | ------------- | -------------------------------------------------------------------- |
| `--text-display` | 34px / 700    | The prescribed weight during a set. Must be readable at arm's length |
| `--text-title`   | 24px / 650    | Screen titles                                                        |
| `--text-heading` | 18px / 600    | Section headings                                                     |
| `--text-body`    | 15px / 450    | Body copy                                                            |
| `--text-label`   | 13px / 500    | Labels, metadata                                                     |
| `--text-caption` | 11px / 500    | Fine print, units                                                    |

Numbers that update live (timers, weights, rep counts) use `font-variant-numeric:
tabular-nums` so they do not jitter as they change.

### Motion

| Token             | Duration | Use                                |
| ----------------- | -------- | ---------------------------------- |
| `--motion-fast`   | 140ms    | Taps, toggles, presses             |
| `--motion-medium` | 260ms    | Panels, expansion, screen elements |
| `--motion-slow`   | 420ms    | Screen transitions, celebrations   |

Easing is `cubic-bezier(0.22, 1, 0.36, 1)` — decisive out, soft landing.

**Always honour `prefers-reduced-motion`.** Animation is decoration; the app must work
identically without it.

## 6. Purple-blue, the default palette

| Role                       | Value                  |
| -------------------------- | ---------------------- |
| Brand gradient             | `#7C5CFF` -> `#3D8BFF` |
| Accent gradient            | `#A855F7` -> `#6366F1` |
| Background deep            | `#0B0A14`              |
| Background elevated        | `#131126`              |
| Surface tint               | `124, 92, 255`         |
| Text primary               | `#ECE9F6`              |
| Text secondary             | `#A9A3C7`              |
| Text muted                 | `#6F6992`              |
| Success                    | `#34D399` -> `#10B981` |
| Warning                    | `#FBBF24` -> `#F59E0B` |
| Danger                     | `#FB7185` -> `#E11D48` |
| Muscle body fill           | `#1C1934`              |
| Muscle body stroke         | `#4A4470`              |
| Muscle highlight primary   | `#A855F7`              |
| Muscle highlight secondary | `#3D8BFF`              |

## 7. Icon usage

Icons are load-bearing here, not decoration — Omar is a visual thinker and asked for
"plenty of icons everywhere". Every list row, stat, habit and exercise category carries one.

- Default stroke width `1.75`, size `20`. Size `24` for navigation, `28` for hero stats.
- Icons that carry meaning on their own get an `aria-label`. Icons next to a text label are
  `aria-hidden`.
- One consistent icon per concept across the whole app. The mapping lives in
  `src/components/icons/` so it cannot drift.

## 8. Accessibility, briefly

- Body text must clear 4.5:1 contrast against its actual surface — check against the
  gradient, not against `--background-deep`.
- Never use colour alone to signal state. Pair it with an icon or text.
- Everything interactive gets a visible focus ring.
- Respect `prefers-reduced-motion`.
