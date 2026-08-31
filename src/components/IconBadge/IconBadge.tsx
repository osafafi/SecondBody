import type { ReactNode } from 'react';

import styles from './IconBadge.module.css';

export type IconBadgeTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
export type IconBadgeSize = 'small' | 'medium' | 'large';

export type IconBadgeProps = {
  /** A lucide icon element. */
  icon: ReactNode;

  tone?: IconBadgeTone;
  size?: IconBadgeSize;

  /** Fills with the full brand gradient. For the single most important badge on a screen. */
  isSolid?: boolean;

  /**
   * Describes the icon for screen readers.
   *
   * Leave undefined when the badge sits next to a text label that already says
   * the same thing — a duplicate announcement is worse than none.
   */
  accessibleLabel?: string;

  className?: string;
};

const TONE_CLASS_NAMES: Record<IconBadgeTone, string> = {
  brand: styles.toneBrand ?? '',
  neutral: styles.toneNeutral ?? '',
  success: styles.toneSuccess ?? '',
  warning: styles.toneWarning ?? '',
  danger: styles.toneDanger ?? '',
};

const SIZE_CLASS_NAMES: Record<IconBadgeSize, string> = {
  small: styles.sizeSmall ?? '',
  medium: styles.sizeMedium ?? '',
  large: styles.sizeLarge ?? '',
};

/** Wraps an icon in a gradient container so it can anchor a row, stat or heading. */
export function IconBadge({
  icon,
  tone = 'brand',
  size = 'medium',
  isSolid = false,
  accessibleLabel,
  className,
}: IconBadgeProps) {
  const combinedClassNames = [
    styles.badge,
    isSolid ? styles.isSolid : TONE_CLASS_NAMES[tone],
    SIZE_CLASS_NAMES[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={combinedClassNames}
      role={accessibleLabel ? 'img' : undefined}
      aria-label={accessibleLabel}
      aria-hidden={accessibleLabel ? undefined : true}
    >
      {icon}
    </span>
  );
}
