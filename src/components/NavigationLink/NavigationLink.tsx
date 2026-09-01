import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import styles from './NavigationLink.module.css';

export type NavigationLinkTone = 'primary' | 'secondary' | 'ghost';
export type NavigationLinkSize = 'compact' | 'standard';

export type NavigationLinkProps = {
  /** A path from `APP_ROUTE_PATHS`, or one of the builders beside it. */
  to: string;

  tone?: NavigationLinkTone;
  size?: NavigationLinkSize;
  isFullWidth?: boolean;

  /** Rendered before the label. Pass a lucide icon. */
  leadingIcon?: ReactNode;

  /** Rendered after the label. */
  trailingIcon?: ReactNode;

  /** When the visible label is shorter than what should be announced. */
  accessibleLabel?: string;

  className?: string;

  children?: ReactNode;
};

/**
 * A link that looks like a button, for the places one screen leads to another.
 *
 * `GradientButton` says not to build a tappable thing out of a surface and an
 * `onClick`, and it is right — but it renders a `<button>`, and a control that
 * navigates is a link. A link can be opened in a new tab, is announced as a
 * link, and works when JavaScript is still catching up. So the rule stands and
 * this is the other half of it: **use `GradientButton` when something happens,
 * use this when you go somewhere.**
 *
 * The tones deliberately mirror `GradientButton`'s so the two can sit in the
 * same row without one looking like a mistake. This exists because the same
 * pill was being written out a fourth time in a fourth CSS module, and each
 * copy was a fresh chance for the focus ring to be wrong.
 */
const TONE_CLASS_NAMES: Record<NavigationLinkTone, string> = {
  primary: styles.tonePrimary ?? '',
  secondary: styles.toneSecondary ?? '',
  ghost: styles.toneGhost ?? '',
};

export function NavigationLink({
  to,
  tone = 'secondary',
  size = 'standard',
  isFullWidth = false,
  leadingIcon,
  trailingIcon,
  accessibleLabel,
  className,
  children,
}: NavigationLinkProps) {
  const combinedClassNames = [
    styles.link,
    TONE_CLASS_NAMES[tone],
    size === 'compact' ? styles.sizeCompact : null,
    isFullWidth ? styles.isFullWidth : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link className={combinedClassNames} to={to} aria-label={accessibleLabel}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
