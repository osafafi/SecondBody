import { Minus, Plus } from 'lucide-react';

import styles from './NumberStepper.module.css';

export type NumberStepperProps = {
  /** Announced to screen readers and shown above the value. */
  label: string;

  value: number;

  /** How much one press moves it. */
  step: number;

  /** Presses below this do nothing. */
  minimumValue: number;

  /** Shown next to the number: "kg", "reps", "m". */
  unitLabel: string;

  /**
   * A small line under the control, such as what was prescribed.
   *
   * Explicitly `| undefined` because `exactOptionalPropertyTypes` is on: a
   * caller that computes the text conditionally has to be able to pass the
   * result straight through.
   */
  helperText?: string | undefined;

  onValueChanged: (value: number) => void;
};

/** Kills the floating point noise 0.1 + 0.2 arithmetic leaves behind. */
function roundToTwoDecimalPlaces(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * A big number with a minus and a plus either side of it.
 *
 * Two buttons rather than a text field, because this is used mid-set: a
 * keyboard covering half the screen to change 12 reps to 11 is the wrong
 * trade, and a stepper cannot produce a value that is not a valid step.
 *
 * The number itself uses tabular figures, so 9 becoming 10 does not shift the
 * buttons under the thumb that is pressing them.
 */
export function NumberStepper({
  label,
  value,
  step,
  minimumValue,
  unitLabel,
  helperText,
  onValueChanged,
}: NumberStepperProps) {
  const changeBy = (amount: number) => {
    onValueChanged(roundToTwoDecimalPlaces(Math.max(minimumValue, value + amount)));
  };

  return (
    <div className={styles.stepper}>
      <span className={styles.label} id={`${label}-stepper-label`}>
        {label}
      </span>

      <div className={styles.controlRow}>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => {
            changeBy(-step);
          }}
          disabled={value <= minimumValue}
          aria-label={`Less ${label.toLowerCase()}`}
        >
          <Minus size={22} strokeWidth={2.25} aria-hidden />
        </button>

        <output className={styles.readout} aria-labelledby={`${label}-stepper-label`}>
          <span className={styles.value}>{value}</span>
          <span className={styles.unit}>{unitLabel}</span>
        </output>

        <button
          type="button"
          className={styles.stepButton}
          onClick={() => {
            changeBy(step);
          }}
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus size={22} strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      {helperText ? <p className={styles.helperText}>{helperText}</p> : null}
    </div>
  );
}
