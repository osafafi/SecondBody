import { createElement } from 'react';
import { AlertTriangle, ChevronRight, SkipForward } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buildExerciseDetailPath } from '@/app/appRoutes';
import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { PRESENTATION_BY_EFFORT_RATING } from '@/components/icons/effortRatingIcons';
import { PRESENTATION_BY_SESSION_FEELING } from '@/components/icons/sessionFeelingIcons';
import { findExerciseById } from '@/content/exercises/allExercises';
import { findPhaseForWeekNumber, findSessionTemplate } from '@/domain/programPhases';
import type { ProgramTemplate } from '@/types/programTypes';
import type { PerformedExercise, WorkoutSession } from '@/types/trainingHistoryTypes';

import {
  describePerformedSet,
  describeSessionDuration,
  describeSessionVolume,
  describeSetAgainstPrescription,
  describeSetCount,
} from '../sessionDetailWording';
import styles from './LoggedSessionPanel.module.css';

export type LoggedSessionPanelProps = {
  session: WorkoutSession;

  /** Used to name the session, which the stored document does not carry. */
  programTemplate: ProgramTemplate;
};

/**
 * A session that actually happened: every set, at the weight it was done at,
 * with how it felt.
 *
 * The stored document is the whole source here. Nothing is recomputed — the
 * total volume was denormalised onto the session when it was written, and
 * recalculating it on a screen would create a second answer that could disagree
 * with the one the charts read.
 *
 * A session in progress renders through here too. It has no finish time, no
 * duration and no overall feeling, and the panel simply leaves those out rather
 * than filling them with zeroes.
 */
export function LoggedSessionPanel({ session, programTemplate }: LoggedSessionPanelProps) {
  const sessionDisplayName = resolveSessionDisplayName(programTemplate, session);
  const duration = describeSessionDuration(session.durationSeconds);
  const feeling = session.overallFeeling
    ? PRESENTATION_BY_SESSION_FEELING[session.overallFeeling]
    : null;

  const isUnfinished = session.status !== 'completed';

  return (
    <>
      <GradientSurface as="section" variant="elevated" radius="xlarge" className={styles.headline}>
        <p className={styles.eyebrow}>
          Session {session.sessionLetter} · Week {session.weekNumber} · Phase {session.phaseNumber}
        </p>

        <h2 className={styles.title}>{sessionDisplayName}</h2>

        {isUnfinished ? (
          <p className={styles.unfinishedNotice}>
            This one was started and never finished. What is below is what got logged.
          </p>
        ) : null}

        <dl className={styles.statRow}>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>Volume</dt>
            <dd className={styles.statValue}>
              {describeSessionVolume(session.totalVolumeKilograms)}
            </dd>
          </div>

          {duration ? (
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Took</dt>
              <dd className={styles.statValue}>{duration}</dd>
            </div>
          ) : null}

          {feeling ? (
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Felt</dt>
              <dd className={styles.statValue}>
                {/*
                 * createElement rather than JSX: the icon is chosen from a table
                 * at render time, and the linter reads `<Icon />` as a component
                 * being defined during render.
                 */}
                {createElement(feeling.icon, { size: 16, strokeWidth: 2, 'aria-hidden': true })}
                {feeling.label}
              </dd>
            </div>
          ) : null}
        </dl>
      </GradientSurface>

      {session.sessionNotes ? (
        <GradientSurface variant="recessed" radius="large" className={styles.sessionNotes}>
          <h3 className={styles.sessionNotesHeading}>What you wrote afterwards</h3>
          <p className={styles.sessionNotesText}>{session.sessionNotes}</p>
        </GradientSurface>
      ) : null}

      <ol className={styles.exercises}>
        {[...session.performedExercises]
          .sort((first, second) => first.orderIndex - second.orderIndex)
          .map((performedExercise) => (
            <li key={`${String(performedExercise.orderIndex)}-${performedExercise.exerciseId}`}>
              <PerformedExerciseCard performedExercise={performedExercise} />
            </li>
          ))}
      </ol>
    </>
  );
}

function PerformedExerciseCard({ performedExercise }: { performedExercise: PerformedExercise }) {
  const exercise = findExerciseById(performedExercise.exerciseId);
  const displayName = exercise?.displayName ?? performedExercise.exerciseId;

  return (
    <GradientSurface variant="elevated" radius="large" className={styles.exerciseCard}>
      <Link
        className={styles.exerciseHeading}
        to={buildExerciseDetailPath(performedExercise.exerciseId)}
      >
        <ExerciseAnimation
          exerciseId={performedExercise.exerciseId}
          displayName={displayName}
          primaryMuscleGroups={exercise?.primaryMuscleGroups ?? []}
          className={styles.exerciseAnimation ?? ''}
        />

        <span className={styles.exerciseText}>
          <span className={styles.exerciseName}>{displayName}</span>
          <span className={styles.exerciseSetCount}>
            {performedExercise.wasSkipped
              ? 'Skipped'
              : describeSetCount(performedExercise.performedSets.length)}
          </span>
        </span>

        <ChevronRight className={styles.exerciseChevron} size={18} strokeWidth={2} aria-hidden />
      </Link>

      {performedExercise.wasSkipped ? (
        <p className={styles.skipReason}>
          <SkipForward size={14} strokeWidth={2} aria-hidden />
          {performedExercise.skipReason ?? 'No reason was given.'}
        </p>
      ) : (
        <ol className={styles.setRows}>
          {performedExercise.performedSets.map((performedSet) => {
            const effort = PRESENTATION_BY_EFFORT_RATING[performedSet.effortRating];
            const againstPrescription = describeSetAgainstPrescription(performedSet);

            return (
              <li key={performedSet.setNumber} className={styles.setRow}>
                <span className={styles.setNumber} aria-hidden>
                  {performedSet.setNumber}
                </span>

                <span className={styles.setText}>
                  <span className={styles.setResult}>
                    <span className={styles.screenReaderOnly}>Set {performedSet.setNumber}: </span>
                    {describePerformedSet(performedSet)}
                  </span>

                  {againstPrescription ? (
                    <span className={styles.setAgainstPrescription}>{againstPrescription}</span>
                  ) : null}

                  {/*
                   * Under the set rather than beside it. A set that both went
                   * off the prescription and hurt has three things to say, and
                   * three things across a phone row leaves each of them wrapped
                   * onto two lines.
                   */}
                  {performedSet.didCauseSharpPain ? (
                    <span className={styles.painFlag}>
                      <AlertTriangle size={14} strokeWidth={2} aria-hidden />
                      Sharp pain
                    </span>
                  ) : null}
                </span>

                <span className={styles.setEffort}>
                  {createElement(effort.icon, {
                    size: 14,
                    strokeWidth: 2,
                    'aria-hidden': true,
                  })}
                  {effort.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </GradientSurface>
  );
}

/**
 * "Legs & Pull" for a stored session.
 *
 * The document holds the week and the letter but not the name, because the name
 * belongs to the content and the content is what changes. Read from the phase
 * the session was actually performed in, so renaming a session in a later phase
 * does not rewrite what an old one was called.
 */
function resolveSessionDisplayName(
  programTemplate: ProgramTemplate,
  session: WorkoutSession,
): string {
  const phase = findPhaseForWeekNumber(programTemplate, session.weekNumber);
  const sessionTemplate = phase ? findSessionTemplate(phase, session.sessionLetter) : null;

  return sessionTemplate?.displayName ?? `Session ${session.sessionLetter}`;
}
