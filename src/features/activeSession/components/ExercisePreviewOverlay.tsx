import { ArrowLeft, Play } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import type { SessionBoardEntry } from '@/domain/sessionBoard';

import styles from './ExercisePreviewOverlay.module.css';
import { ExerciseReferenceContent } from './ExerciseReferenceContent';

export type ExercisePreviewOverlayProps = {
  entry: SessionBoardEntry;

  /** Where the back button goes, in words, so the label can say it. */
  backLabel: string;

  onExerciseChosen: (exerciseIndex: number) => void;
  onClosed: () => void;
};

/** The line under the title: where this movement stands right now. */
function describeWhereItStands(entry: SessionBoardEntry): string {
  const setCount = entry.plannedExercise.workingSetCount;

  switch (entry.status) {
    case 'done':
      return 'Done for today';

    case 'skipped':
      return 'Skipped — you can still come back to it';

    case 'waitingOnMachine':
      return 'Waiting on the machine';

    case 'inProgress':
      return `${String(entry.loggedSetCount)} of ${String(setCount)} sets done`;

    case 'notStarted':
      return entry.isCurrent ? 'Up now' : 'Not started yet';
  }
}

/**
 * An exercise, looked at rather than performed.
 *
 * This is the whole of F8: "i'd like to be able to go in each exercise to check
 * it out, and be able to go back without marking it as skipped or fake
 * completing it." So the only thing on this screen that reaches the state
 * machine is the one button that says it will, and closing it does nothing at
 * all.
 *
 * It draws the same `ExerciseReferenceContent` the brief does, on purpose. What
 * he reads while deciding whether he can do a movement and what he reads while
 * standing in front of it should not be two different pages.
 */
export function ExercisePreviewOverlay({
  entry,
  backLabel,
  onExerciseChosen,
  onClosed,
}: ExercisePreviewOverlayProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Exercise preview">
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onClosed}>
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          {backLabel}
        </button>

        <p className={styles.standing}>{describeWhereItStands(entry)}</p>
      </header>

      <div className={styles.content}>
        <ExerciseReferenceContent plannedExercise={entry.plannedExercise} />

        {entry.plannedExercise.slotNote ? (
          <GradientSurface variant="recessed" radius="large" className={styles.note}>
            <p>{entry.plannedExercise.slotNote}</p>
          </GradientSurface>
        ) : null}
      </div>

      <div className={styles.actions}>
        {entry.canBeReturnedTo && !entry.isCurrent ? (
          <GradientButton
            tone="primary"
            size="large"
            isFullWidth
            onClick={() => {
              onExerciseChosen(entry.exerciseIndex);
            }}
            leadingIcon={<Play size={18} strokeWidth={2.5} aria-hidden />}
          >
            Do this one now
          </GradientButton>
        ) : null}

        <GradientButton tone="ghost" isFullWidth onClick={onClosed}>
          {entry.isCurrent ? 'Back to it' : backLabel}
        </GradientButton>
      </div>
    </div>
  );
}
