import styles from './PendingScreen.module.css';

export type PendingScreenProps = {
  /** What is being waited for, e.g. "Checking your session". */
  label: string;
};

/**
 * A whole-screen "wait a moment", used by the gates in `src/app/`.
 *
 * Deliberately quiet. It is usually on screen for a few hundred milliseconds,
 * and a brisk, high-contrast spinner in that window reads as the app struggling
 * rather than starting.
 */
export function PendingScreen({ label }: PendingScreenProps) {
  return (
    <div className={styles.screen} role="status">
      <span className={styles.pulse} aria-hidden />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
