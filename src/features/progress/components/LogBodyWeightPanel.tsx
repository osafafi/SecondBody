import { useState } from 'react';
import { Check } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { NumberStepper } from '@/components/NumberStepper/NumberStepper';

import { formatWeightKilograms } from '../progressWording';
import styles from './LogBodyWeightPanel.module.css';

/** A bathroom scale moves in 100 gram steps, so the control does too. */
const WEIGHT_STEP_KILOGRAMS = 0.1;

/** Below this, the number is a typo rather than a person. */
const MINIMUM_WEIGHT_KILOGRAMS = 30;

export type LogBodyWeightPanelProps = {
  /** Prefilled with the last reading, so a stable week is two taps. */
  startingWeightKilograms: number;

  /** True once today already has a weigh-in. Logging again is still allowed. */
  hasWeighedInToday: boolean;

  isSaving: boolean;

  saveErrorMessage: string | null;

  onWeightLogged: (weightKilograms: number) => void;
};

/**
 * The only way into `bodyMetrics` until the habits screen lands in M8.
 *
 * M7 draws a weight trend, and a trend with no way to add a reading is a chart
 * of an empty collection. The quick log on Today is still M8's — this is the
 * deliberate version, on the screen where the number is being looked at anyway.
 *
 * The stepper is prefilled rather than blank because the common case is a weight
 * within a few hundred grams of the last one, and because a blank field on a
 * phone means a keyboard covering half the screen.
 */
export function LogBodyWeightPanel({
  startingWeightKilograms,
  hasWeighedInToday,
  isSaving,
  saveErrorMessage,
  onWeightLogged,
}: LogBodyWeightPanelProps) {
  const [weightKilograms, setWeightKilograms] = useState(startingWeightKilograms);

  return (
    <GradientSurface as="section" variant="recessed" radius="xlarge" className={styles.panel}>
      <div className={styles.headlineText}>
        <span className={styles.eyebrow}>Today</span>
        <h2 className={styles.title}>{hasWeighedInToday ? 'Weighed in today' : 'Log a weight'}</h2>
        <p className={styles.description}>
          {hasWeighedInToday
            ? 'Already logged for today. Adding another reading is fine — both count towards the average.'
            : 'First thing, after the bathroom, before anything to eat or drink. Same conditions every time is what makes the line mean something.'}
        </p>
      </div>

      <NumberStepper
        label="Weight"
        value={weightKilograms}
        step={WEIGHT_STEP_KILOGRAMS}
        minimumValue={MINIMUM_WEIGHT_KILOGRAMS}
        unitLabel="kg"
        onValueChanged={setWeightKilograms}
      />

      <GradientButton
        tone="primary"
        isFullWidth
        disabled={isSaving}
        onClick={() => {
          onWeightLogged(weightKilograms);
        }}
      >
        <Check size={18} strokeWidth={2} aria-hidden />
        {isSaving ? 'Saving' : `Log ${formatWeightKilograms(weightKilograms)}`}
      </GradientButton>

      {saveErrorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {saveErrorMessage}
        </p>
      ) : null}
    </GradientSurface>
  );
}
