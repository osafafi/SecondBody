import { ChevronRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buildExerciseDetailPath } from '@/app/appRoutes';
import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { findExerciseById } from '@/content/exercises/allExercises';
import type { PlannedSessionOutline } from '@/domain/plannedSessionOutline';

import { describePlannedPrescription, describeSetCount } from '../sessionDetailWording';
import styles from './PlannedSessionPanel.module.css';

export type PlannedSessionPanelProps = {
  plannedSession: PlannedSessionOutline;
};

/**
 * What a training day still to come actually contains.
 *
 * **Movements, sets and reps. No weights.** Every number that goes on a bar is
 * decided when the session opens, against history read at that moment — see the
 * note at the top of `src/domain/plannedSessionOutline.ts`. A weight shown here
 * would be a second opinion nobody asked for, and one that had already changed
 * by the time it was acted on.
 *
 * **There is no way into the session player from here either.** Reading what is
 * on Friday is not starting it. The Today screen owns starting a session,
 * because it is the screen that knows about the 48-hour rail, and a second door
 * into the player would be a second place for that rail to be got wrong.
 */
export function PlannedSessionPanel({ plannedSession }: PlannedSessionPanelProps) {
  return (
    <>
      <GradientSurface as="section" variant="elevated" radius="xlarge" className={styles.headline}>
        <p className={styles.eyebrow}>
          Session {plannedSession.sessionLetter} · Week {plannedSession.weekNumber} of{' '}
          {plannedSession.totalWeekCount}
        </p>

        <h2 className={styles.title}>{plannedSession.displayName}</h2>
        <p className={styles.summary}>{plannedSession.summary}</p>

        <p className={styles.phase}>
          Phase {plannedSession.phaseNumber} · {plannedSession.phaseDisplayName} · working at RPE{' '}
          {plannedSession.targetEffortRange.minimumRatingOfPerceivedExertion}–
          {plannedSession.targetEffortRange.maximumRatingOfPerceivedExertion}
        </p>
      </GradientSurface>

      {plannedSession.weekNote ? (
        <GradientSurface variant="accent" radius="large" className={styles.note}>
          <IconBadge icon={<Info size={18} strokeWidth={2} />} size="small" isSolid />
          <p>{plannedSession.weekNote}</p>
        </GradientSurface>
      ) : null}

      <GradientSurface as="section" variant="elevated" radius="large" className={styles.movements}>
        <div className={styles.movementsHeading}>
          <h3 className={styles.movementsTitle}>What is in it</h3>
          <p className={styles.movementsCount}>
            {describeSetCount(plannedSession.workingSetCount)} of each
          </p>
        </div>

        <ol className={styles.movementRows}>
          {plannedSession.slots.map((slot) => {
            const exercise = findExerciseById(slot.exerciseId);

            return (
              <li key={slot.exerciseId}>
                <Link className={styles.movementRow} to={buildExerciseDetailPath(slot.exerciseId)}>
                  <ExerciseAnimation
                    exerciseId={slot.exerciseId}
                    displayName={exercise?.displayName ?? slot.exerciseId}
                    primaryMuscleGroups={exercise?.primaryMuscleGroups ?? []}
                    className={styles.movementAnimation ?? ''}
                  />

                  <span className={styles.movementText}>
                    <span className={styles.movementName}>
                      {exercise?.displayName ?? slot.exerciseId}
                    </span>
                    <span className={styles.movementPrescription}>
                      {describePlannedPrescription(
                        slot.prescription,
                        plannedSession.workingSetCount,
                      )}
                    </span>
                    {slot.slotNote ? (
                      <span className={styles.movementNote}>{slot.slotNote}</span>
                    ) : null}
                  </span>

                  <ChevronRight
                    className={styles.movementChevron}
                    size={18}
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ol>

        <p className={styles.noWeightsNote}>
          No weights here on purpose. They are worked out from your last sessions the moment this
          one starts.
        </p>
      </GradientSurface>
    </>
  );
}
