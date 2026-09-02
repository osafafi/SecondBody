import { Dumbbell, Undo2 } from 'lucide-react';

import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { findExerciseById } from '@/content/exercises/allExercises';

import styles from './UnavailableExercisesPanel.module.css';

export type UnavailableExercisesPanelProps = {
  /** From the profile. Usually empty, which is the state this panel opens in. */
  unavailableExerciseIds: string[];

  isSaving: boolean;

  saveErrorMessage: string | null;

  onExerciseRestored: (exerciseId: string) => void;
};

/**
 * The movements he has told the app his gym has not got, and the way to undo it.
 *
 * The other half of F13. Flagging happens in the gym, one-handed, on a screen
 * that is deliberately quick — so the undo has to live somewhere calm, and it
 * has to exist, because a mis-tap that quietly changed every future session with
 * no way back would be a worse bug than the one being fixed.
 *
 * Unlike everything else on this screen there is no form and no save button. One
 * row, one action, written immediately: this is a list you remove things from,
 * not a set of answers you revise.
 */
export function UnavailableExercisesPanel({
  unavailableExerciseIds,
  isSaving,
  saveErrorMessage,
  onExerciseRestored,
}: UnavailableExercisesPanelProps) {
  if (unavailableExerciseIds.length === 0) {
    return (
      <GradientSurface variant="recessed" radius="large" className={styles.emptyPanel}>
        <IconBadge icon={<Dumbbell size={18} strokeWidth={2} />} size="small" />
        <p className={styles.emptyMessage}>
          Nothing flagged. When a machine turns out not to exist, say so on the exercise and it will
          show up here.
        </p>
      </GradientSurface>
    );
  }

  return (
    <GradientSurface variant="elevated" radius="large" className={styles.panel}>
      <ul className={styles.list}>
        {unavailableExerciseIds.map((exerciseId) => {
          const exercise = findExerciseById(exerciseId);
          const displayName = exercise?.displayName ?? exerciseId;

          return (
            <li key={exerciseId} className={styles.row}>
              <ExerciseAnimation
                exerciseId={exerciseId}
                displayName={displayName}
                primaryMuscleGroups={exercise?.primaryMuscleGroups ?? []}
                className={styles.animation ?? ''}
              />

              <div className={styles.rowText}>
                <p className={styles.rowName}>{displayName}</p>
                <p className={styles.rowNote}>
                  Swapped for the closest thing your gym has, every session.
                </p>
              </div>

              <GradientButton
                tone="ghost"
                disabled={isSaving}
                onClick={() => {
                  onExerciseRestored(exerciseId);
                }}
                leadingIcon={<Undo2 size={16} strokeWidth={2} aria-hidden />}
              >
                We have got one
              </GradientButton>
            </li>
          );
        })}
      </ul>

      {saveErrorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {saveErrorMessage}
        </p>
      ) : null}
    </GradientSurface>
  );
}
