import { StretchHorizontal } from 'lucide-react';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import type { MobilityRoutine } from '@/types/programTypes';

import styles from './RestDayMobilityNote.module.css';

export type RestDayMobilityNoteProps = {
  mobilityRoutine: MobilityRoutine;
};

/**
 * What a rest day is actually for, named rather than left blank.
 *
 * Deliberately only a name, a duration and the routine's own summary. The full
 * routine — every movement, its volume, and something to tick each one off
 * against — is "rest-day suggestions" on the roadmap, parked there together with
 * the step target it belongs beside. This is the half that stops a rest day
 * being an empty screen, and it costs nothing to replace when the other half is
 * built.
 */
export function RestDayMobilityNote({ mobilityRoutine }: RestDayMobilityNoteProps) {
  return (
    <GradientSurface variant="outlined" radius="large" className={styles.note}>
      <IconBadge
        icon={<StretchHorizontal size={20} strokeWidth={1.75} />}
        tone="neutral"
        size="medium"
      />

      <div className={styles.text}>
        <p className={styles.heading}>
          {mobilityRoutine.displayName} · {mobilityRoutine.estimatedDurationMinutes} min at home
        </p>
        <p className={styles.summary}>{mobilityRoutine.summary}</p>
      </div>
    </GradientSurface>
  );
}
