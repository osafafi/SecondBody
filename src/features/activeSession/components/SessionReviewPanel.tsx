import { createElement } from 'react';
import { Check, SkipForward } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { PRESENTATION_BY_SESSION_FEELING } from '@/components/icons/sessionFeelingIcons';
import { findExerciseById } from '@/content/exercises/allExercises';
import {
  OVERALL_SESSION_FEELINGS,
  type OverallSessionFeeling,
  type PerformedExercise,
} from '@/types/trainingHistoryTypes';

import styles from './SessionReviewPanel.module.css';

export type SessionReviewPanelProps = {
  loggedExercises: PerformedExercise[];
  overallFeeling: OverallSessionFeeling | null;
  sessionNotes: string | null;

  onOverallFeelingChosen: (overallFeeling: OverallSessionFeeling) => void;
  onSessionNotesEdited: (sessionNotes: string) => void;
  onSessionFinished: () => void;
};

function describeLoggedExercise(loggedExercise: PerformedExercise): string {
  if (loggedExercise.wasSkipped) {
    return loggedExercise.skipReason ?? 'Skipped';
  }

  const setCount = loggedExercise.performedSets.length;

  return setCount === 1 ? '1 set' : `${String(setCount)} sets`;
}

/**
 * The last screen before the session is written: how it went, and anything
 * worth remembering.
 *
 * Both answers are optional. A session that is finished without them is still a
 * finished session, and making somebody rate their own workout before the app
 * will let them leave the gym is not what this is for.
 */
export function SessionReviewPanel({
  loggedExercises,
  overallFeeling,
  sessionNotes,
  onOverallFeelingChosen,
  onSessionNotesEdited,
  onSessionFinished,
}: SessionReviewPanelProps) {
  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>That&rsquo;s the work done</h2>
        <p className={styles.subtitle}>Two quick things, then it is saved.</p>
      </header>

      <fieldset className={styles.feelingGroup}>
        <legend className={styles.legend}>How was that overall?</legend>

        <div className={styles.feelingOptions}>
          {OVERALL_SESSION_FEELINGS.map((feeling) => {
            const presentation = PRESENTATION_BY_SESSION_FEELING[feeling];
            const isSelected = overallFeeling === feeling;

            return (
              <button
                key={feeling}
                type="button"
                className={[styles.feelingOption, isSelected ? styles.isSelected : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={isSelected}
                onClick={() => {
                  onOverallFeelingChosen(feeling);
                }}
              >
                {createElement(presentation.icon, {
                  size: 22,
                  strokeWidth: 1.75,
                  'aria-hidden': true,
                })}
                <span>{presentation.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className={styles.notesField}>
        <span className={styles.legend}>Anything worth noting?</span>
        <textarea
          className={styles.notesInput}
          rows={3}
          value={sessionNotes ?? ''}
          placeholder="Knee was quiet today. Bench was taken so I waited."
          onChange={(event) => {
            onSessionNotesEdited(event.target.value);
          }}
        />
      </label>

      <GradientSurface variant="recessed" radius="large" className={styles.doneList}>
        <h3 className={styles.doneHeading}>What you did</h3>

        {loggedExercises.length === 0 ? (
          <p className={styles.nothingLogged}>
            Nothing logged this time. That still counts as turning up.
          </p>
        ) : (
          <ul>
            {loggedExercises.map((loggedExercise) => (
              <li key={loggedExercise.exerciseId} className={styles.doneRow}>
                <span className={styles.doneName}>
                  {findExerciseById(loggedExercise.exerciseId)?.shortDisplayName ??
                    loggedExercise.exerciseId}
                </span>
                <span
                  className={[styles.doneDetail, loggedExercise.wasSkipped ? styles.isSkipped : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {loggedExercise.wasSkipped ? (
                    <SkipForward size={14} strokeWidth={2} aria-hidden />
                  ) : null}
                  {describeLoggedExercise(loggedExercise)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GradientSurface>

      <GradientButton
        tone="primary"
        size="large"
        isFullWidth
        onClick={onSessionFinished}
        trailingIcon={<Check size={18} strokeWidth={2.5} aria-hidden />}
      >
        Finish the session
      </GradientButton>
    </div>
  );
}
