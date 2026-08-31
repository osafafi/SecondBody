import { Trophy } from 'lucide-react';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';

import { formatRecordEffort, formatShortDate } from '../progressWording';
import styles from './PersonalRecordsPanel.module.css';

/** One record, with its exercise resolved to a name the screen can show. */
export type NamedPersonalRecord = {
  exerciseId: string;
  exerciseDisplayName: string;
  bestWeightKilograms: number;
  bestRepsAtBestWeight: number;
  estimatedOneRepMaxKilograms: number;
  achievedOn: string;
};

export type PersonalRecordsPanelProps = {
  /** Already ordered by the screen. Heaviest estimate first. */
  records: readonly NamedPersonalRecord[];
};

/**
 * The best each lift has ever been.
 *
 * Ranked by estimated one-rep max rather than by weight on the bar, which is the
 * only fair comparison between "60 for 8" and "50 for 12" — see
 * `estimatedOneRepMax.ts`. The estimate is shown small and second, because the
 * set that actually happened is the thing worth remembering.
 */
export function PersonalRecordsPanel({ records }: PersonalRecordsPanelProps) {
  return (
    <GradientSurface as="section" radius="xlarge" className={styles.panel}>
      <header className={styles.headlineRow}>
        <IconBadge icon={<Trophy size={20} strokeWidth={1.75} />} />

        <div className={styles.headlineText}>
          <span className={styles.eyebrow}>Personal records</span>
          <h2 className={styles.title}>
            {records.length === 0
              ? 'None yet'
              : `${String(records.length)} ${records.length === 1 ? 'lift' : 'lifts'}`}
          </h2>
        </div>
      </header>

      {records.length === 0 ? (
        <p className={styles.reading}>
          A record gets set the first time you train a lift, and beaten whenever you do more with it
          than you did before — heavier, or the same weight for more reps. Nothing here until the
          first session is logged.
        </p>
      ) : (
        <ul className={styles.recordList}>
          {records.map((record) => (
            <li className={styles.record} key={record.exerciseId}>
              <div className={styles.recordText}>
                <span className={styles.recordName}>{record.exerciseDisplayName}</span>
                <span className={styles.recordDate}>{formatShortDate(record.achievedOn)}</span>
              </div>

              <div className={styles.recordNumbers}>
                <span className={styles.recordEffort}>
                  {formatRecordEffort(record.bestWeightKilograms, record.bestRepsAtBestWeight)}
                </span>
                <span className={styles.recordEstimate}>
                  ≈ {record.estimatedOneRepMaxKilograms.toFixed(1)} kg max
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GradientSurface>
  );
}
