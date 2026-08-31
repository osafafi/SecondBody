import type { ReactNode } from 'react';

import styles from './ScreenHeader.module.css';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;

  /** Usually an IconBadge, giving the screen a recognisable anchor. */
  leadingSlot?: ReactNode;

  /** Usually an action button, aligned to the right. */
  trailingSlot?: ReactNode;
};

/** The title block at the top of every screen. */
export function ScreenHeader({ title, subtitle, leadingSlot, trailingSlot }: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      {leadingSlot}

      <div className={styles.textGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>

      {trailingSlot ? <div className={styles.trailingSlot}>{trailingSlot}</div> : null}
    </header>
  );
}
