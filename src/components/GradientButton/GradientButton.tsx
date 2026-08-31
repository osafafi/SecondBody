import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './GradientButton.module.css';

export type GradientButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost';
export type GradientButtonSize = 'standard' | 'large';

export type GradientButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: GradientButtonTone;
  size?: GradientButtonSize;
  isFullWidth?: boolean;

  /** Rendered before the label. Pass a lucide icon. */
  leadingIcon?: ReactNode;

  /** Rendered after the label. */
  trailingIcon?: ReactNode;

  children?: ReactNode;
};

const TONE_CLASS_NAMES: Record<GradientButtonTone, string> = {
  primary: styles.tonePrimary ?? '',
  secondary: styles.toneSecondary ?? '',
  danger: styles.toneDanger ?? '',
  ghost: styles.toneGhost ?? '',
};

/**
 * The application's button.
 *
 * A real `<button>` element, so it is keyboard operable and announced correctly,
 * with the gradient treatment applied on top. Do not build a tappable thing out
 * of `GradientSurface` and an onClick — use this.
 */
export function GradientButton({
  tone = 'primary',
  size = 'standard',
  isFullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  type = 'button',
  children,
  ...remainingButtonProps
}: GradientButtonProps) {
  const combinedClassNames = [
    styles.button,
    TONE_CLASS_NAMES[tone],
    size === 'large' ? styles.sizeLarge : null,
    isFullWidth ? styles.isFullWidth : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={combinedClassNames} type={type} {...remainingButtonProps}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
