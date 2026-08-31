import { MessageCircle } from 'lucide-react';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';

import styles from './DailyCoachNote.module.css';

export type DailyCoachNoteProps = {
  /** From `selectDailyCoachLine`. Null means say nothing, and render nothing. */
  coachLine: string | null;
};

/**
 * One line from Harout, or nothing at all.
 *
 * The nothing matters as much as the line. Most days there is no situation worth
 * remarking on, and a card that filled itself with something generic rather than
 * disappearing would train him to stop reading the days it has something real to
 * say. See `selectCoachLine` — silence is part of the voice.
 */
export function DailyCoachNote({ coachLine }: DailyCoachNoteProps) {
  if (!coachLine) {
    return null;
  }

  return (
    <GradientSurface variant="glass" radius="large" className={styles.note}>
      <IconBadge icon={<MessageCircle size={18} strokeWidth={1.75} />} tone="brand" size="small" />
      <p className={styles.line}>{coachLine}</p>
    </GradientSurface>
  );
}
