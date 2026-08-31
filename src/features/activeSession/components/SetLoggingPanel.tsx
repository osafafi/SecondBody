import { createElement } from 'react';
import { Check, ShieldAlert, TrendingUp } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { NumberStepper } from '@/components/NumberStepper/NumberStepper';
import { PRESENTATION_BY_EFFORT_RATING } from '@/components/icons/effortRatingIcons';
import { findExerciseById } from '@/content/exercises/allExercises';
import {
  resolveSetCountStep,
  resolveSetCountUnit,
  type SetLogDraft,
} from '@/domain/sessionLogging';
import type { PlannedExercise } from '@/domain/sessionPlanning';
import { EFFORT_RATINGS, type EffortRating } from '@/types/trainingVocabulary';

import { SET_COUNT_UNIT_LABELS } from '../prescriptionWording';
import styles from './SetLoggingPanel.module.css';

export type SetLoggingPanelProps = {
  plannedExercise: PlannedExercise;
  setLogDraft: SetLogDraft;

  /**
   * True when everything logged so far was easy at the top of the range, so the
   * app should say to go up now rather than sitting on it for two days.
   * See docs/TRAINING_PROGRAM.md section 7.
   */
  shouldSuggestGoingUpNow: boolean;

  /** The smallest amount that can be added to this movement, for the suggestion. */
  loadIncrementKilograms: number;

  onDraftChanged: (changes: Partial<SetLogDraft>) => void;
  onSetLogged: () => void;
};

/** Weights step by the smallest increment the equipment actually offers. */
const FALLBACK_WEIGHT_STEP_KILOGRAMS = 2.5;

/**
 * What actually happened on the set: the count, the weight, how it felt, and
 * whether anything hurt.
 *
 * Everything is prefilled with the prescription, so the common case — he did
 * exactly what was asked — is one tap on "Log it". The effort rating is the one
 * answer worth thinking about, because it is the whole of auto-regulation.
 *
 * Pain is asked separately from effort and never as a degree of it. A brutal set
 * and a set that hurt a joint are different events with different responses, and
 * collapsing them into one scale is how an app talks somebody into training
 * through an injury.
 */
export function SetLoggingPanel({
  plannedExercise,
  setLogDraft,
  shouldSuggestGoingUpNow,
  loadIncrementKilograms,
  onDraftChanged,
  onSetLogged,
}: SetLoggingPanelProps) {
  const exercise = findExerciseById(plannedExercise.exerciseId);
  const countUnit = resolveSetCountUnit(plannedExercise.prescription);
  const hasWeight = setLogDraft.actualWeightKilograms !== null;

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <p className={styles.setLabel}>
          Set {String(setLogDraft.setNumber)} · {exercise?.shortDisplayName ?? ''}
        </p>
        <h2 className={styles.title}>How did that go?</h2>
      </header>

      <GradientSurface variant="elevated" radius="xlarge" className={styles.numbers}>
        <NumberStepper
          label={SET_COUNT_UNIT_LABELS[countUnit]}
          value={setLogDraft.actualReps}
          step={resolveSetCountStep(countUnit)}
          minimumValue={0}
          helperText={`Asked for ${String(setLogDraft.prescribedReps)}`}
          onValueChanged={(actualReps) => {
            onDraftChanged({ actualReps });
          }}
        />

        {hasWeight ? (
          <NumberStepper
            label="Weight"
            value={setLogDraft.actualWeightKilograms ?? 0}
            step={loadIncrementKilograms || FALLBACK_WEIGHT_STEP_KILOGRAMS}
            minimumValue={0}
            unitLabel="kg"
            helperText={
              setLogDraft.prescribedWeightKilograms === null
                ? undefined
                : `Asked for ${String(setLogDraft.prescribedWeightKilograms)} kg`
            }
            onValueChanged={(actualWeightKilograms) => {
              onDraftChanged({ actualWeightKilograms });
            }}
          />
        ) : null}
      </GradientSurface>

      {shouldSuggestGoingUpNow ? (
        <GradientSurface variant="accent" radius="large" className={styles.suggestion}>
          <TrendingUp size={18} strokeWidth={2} aria-hidden />
          <p>
            Everything so far was easy at the top of the range. Put another{' '}
            {String(loadIncrementKilograms || FALLBACK_WEIGHT_STEP_KILOGRAMS)} kg on for the next
            set rather than waiting for next session.
          </p>
        </GradientSurface>
      ) : null}

      <fieldset className={styles.effortGroup}>
        <legend className={styles.effortLegend}>How it felt</legend>

        <div className={styles.effortOptions}>
          {EFFORT_RATINGS.map((effortRating: EffortRating) => {
            const presentation = PRESENTATION_BY_EFFORT_RATING[effortRating];
            const isSelected = setLogDraft.effortRating === effortRating;

            return (
              <button
                key={effortRating}
                type="button"
                className={[styles.effortOption, isSelected ? styles.isSelected : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={isSelected}
                onClick={() => {
                  onDraftChanged({ effortRating });
                }}
              >
                {/*
                 * createElement rather than JSX, because the icon is chosen from
                 * a table at render time. Written as `<Icon />` the linter reads
                 * it as a component being defined during render.
                 */}
                {createElement(presentation.icon, {
                  size: 22,
                  strokeWidth: 1.75,
                  'aria-hidden': true,
                })}
                <span className={styles.effortLabel}>{presentation.label}</span>
                <span className={styles.effortDescription}>{presentation.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        className={[styles.painToggle, setLogDraft.didCauseSharpPain ? styles.isPainful : '']
          .filter(Boolean)
          .join(' ')}
        aria-pressed={setLogDraft.didCauseSharpPain}
        onClick={() => {
          onDraftChanged({ didCauseSharpPain: !setLogDraft.didCauseSharpPain });
        }}
      >
        <ShieldAlert size={20} strokeWidth={2} aria-hidden />
        <span className={styles.painText}>
          <span className={styles.painLabel}>Sharp or joint pain</span>
          <span className={styles.painDescription}>
            Not muscle burn. A pinch, a stab, or a joint complaining.
          </span>
        </span>
      </button>

      <GradientButton
        tone="primary"
        size="large"
        isFullWidth
        onClick={onSetLogged}
        trailingIcon={<Check size={18} strokeWidth={2.5} aria-hidden />}
      >
        Log it
      </GradientButton>
    </div>
  );
}
