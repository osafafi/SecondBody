import { Hammer } from 'lucide-react';
import type { ReactNode } from 'react';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';

import styles from './ComingSoonPanel.module.css';

export type ComingSoonPanelProps = {
  headline: string;
  description: string;

  /** The milestone that builds this screen, e.g. "M6". Shown as a small tag. */
  milestone: string;

  /** Optional custom icon. Defaults to a hammer. */
  icon?: ReactNode;
};

/**
 * Placeholder for a screen that is routed but not built yet.
 *
 * Deliberately says which milestone delivers it, so nobody has to guess whether
 * a blank screen is unfinished work or a bug. Every one of these should be gone
 * by M8 — if one survives past that, it is a bug.
 */
export function ComingSoonPanel({ headline, description, milestone, icon }: ComingSoonPanelProps) {
  return (
    <GradientSurface variant="outlined" radius="xlarge" className={styles.panel}>
      <IconBadge
        icon={icon ?? <Hammer size={24} strokeWidth={1.75} />}
        tone="neutral"
        size="large"
      />

      <h2 className={styles.headline}>{headline}</h2>
      <p className={styles.description}>{description}</p>

      <span className={styles.milestoneTag}>Arrives in {milestone}</span>
    </GradientSurface>
  );
}
