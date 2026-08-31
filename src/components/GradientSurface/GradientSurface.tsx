import type { HTMLAttributes, ReactNode } from 'react';

import styles from './GradientSurface.module.css';

/**
 * The visual weight of a surface. See docs/DESIGN_SYSTEM.md section 4 for when
 * to reach for each one.
 */
export type GradientSurfaceVariant = 'elevated' | 'recessed' | 'accent' | 'glass' | 'outlined';

export type GradientSurfaceRadius = 'medium' | 'large' | 'xlarge';

/**
 * The element tags a surface is allowed to render as. Kept to a short list so
 * that semantics stay deliberate — if you need a tappable surface, use
 * `GradientButton` rather than adding `button` here, because a button needs
 * button semantics, not just button styling.
 */
export type GradientSurfaceElementTag =
  'div' | 'section' | 'article' | 'header' | 'footer' | 'nav' | 'li' | 'ul';

export type GradientSurfaceProps = HTMLAttributes<HTMLElement> & {
  variant?: GradientSurfaceVariant;
  radius?: GradientSurfaceRadius;

  /** The tag to render. Defaults to a plain `div`. */
  as?: GradientSurfaceElementTag;

  /** Adds the press and focus affordances. Does NOT make it keyboard operable. */
  isInteractive?: boolean;

  children?: ReactNode;
};

const VARIANT_CLASS_NAMES: Record<GradientSurfaceVariant, string> = {
  elevated: styles.variantElevated ?? '',
  recessed: styles.variantRecessed ?? '',
  accent: styles.variantAccent ?? '',
  glass: styles.variantGlass ?? '',
  outlined: styles.variantOutlined ?? '',
};

const RADIUS_CLASS_NAMES: Record<GradientSurfaceRadius, string> = {
  medium: styles.radiusMedium ?? '',
  large: styles.radiusLarge ?? '',
  xlarge: styles.radiusXlarge ?? '',
};

/**
 * Every panel, card and section in the application renders through this
 * component.
 *
 * That is not a style preference — it is how the "no flat cards or sections"
 * requirement is enforced structurally rather than by everyone remembering it.
 * If you find yourself writing a `background-color` in a CSS module, you almost
 * certainly wanted this instead.
 */
export function GradientSurface({
  variant = 'elevated',
  radius = 'large',
  as: ElementTag = 'div',
  isInteractive = false,
  className,
  children,
  ...remainingElementProps
}: GradientSurfaceProps) {
  const combinedClassNames = [
    styles.surface,
    VARIANT_CLASS_NAMES[variant],
    RADIUS_CLASS_NAMES[radius],
    isInteractive ? styles.isInteractive : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ElementTag className={combinedClassNames} {...remainingElementProps}>
      {children}
    </ElementTag>
  );
}
