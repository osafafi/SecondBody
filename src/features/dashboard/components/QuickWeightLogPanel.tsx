import { useState } from 'react';
import { Check, Scale } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { NumberStepper } from '@/components/NumberStepper/NumberStepper';

import styles from './QuickWeightLogPanel.module.css';
import { formatWeightKilograms } from '../todayWording';

/** A bathroom scale moves in 100 gram steps, so the control does too. */
const WEIGHT_STEP_KILOGRAMS = 0.1;

/** Below this, the number is a typo rather than a person. */
const MINIMUM_WEIGHT_KILOGRAMS = 30;

export type QuickWeightLogPanelProps = {
  /**
   * The stepper's starting point: the last reading, or the weight onboarding
   * recorded when the scale has never been used.
   */
  startingWeightKilograms: number;

  /** True once today has a weigh-in. Logging a second one is still allowed. */
  hasWeighedInToday: boolean;

  isSaving: boolean;

  saveErrorMessage: string | null;

  onWeightLogged: (weightKilograms: number) => void;
};

/**
 * The scale, on the screen the app opens on.
 *
 * Deliberately smaller than `LogBodyWeightPanel` on the Progress screen, and
 * deliberately not the same component. That one is where a weigh-in is being
 * thought about — it sits under the trend it moves and explains how to weigh
 * yourself consistently. This one is a two-tap job on the way past the bathroom,
 * and it stays folded shut until it is asked for. Sharing one component would
 * mean one of the two screens carrying the other's chrome.
 *
 * It collapses again once today has a reading, so the common case — the weight
 * is already in — is one line rather than a control asking to be used twice.
 */
export function QuickWeightLogPanel({
  startingWeightKilograms,
  hasWeighedInToday,
  isSaving,
  saveErrorMessage,
  onWeightLogged,
}: QuickWeightLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [weightKilograms, setWeightKilograms] = useState(startingWeightKilograms);

  if (!isOpen) {
    return (
      <GradientSurface as="section" variant="outlined" radius="xlarge" className={styles.panel}>
        <div className={styles.closedRow}>
          <span className={styles.closedIcon} aria-hidden>
            <Scale size={18} strokeWidth={1.75} />
          </span>

          <span className={styles.closedText}>
            <span className={styles.closedTitle}>
              {hasWeighedInToday ? 'Weighed in today' : 'Weigh-in'}
            </span>
            <span className={styles.closedHint}>
              {hasWeighedInToday
                ? `Last logged at ${formatWeightKilograms(startingWeightKilograms)}`
                : 'First thing, before anything to eat or drink'}
            </span>
          </span>

          <GradientButton
            tone="ghost"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            {hasWeighedInToday ? 'Log again' : 'Log it'}
          </GradientButton>
        </div>
      </GradientSurface>
    );
  }

  return (
    <GradientSurface as="section" variant="outlined" radius="xlarge" className={styles.panel}>
      <NumberStepper
        label="Weight"
        value={weightKilograms}
        step={WEIGHT_STEP_KILOGRAMS}
        minimumValue={MINIMUM_WEIGHT_KILOGRAMS}
        unitLabel="kg"
        /*
         * Prefilled from the last reading rather than blank, because the common
         * case is a weight within a few hundred grams of the previous one, and
         * because a blank field on a phone means a keyboard over half the screen.
         */
        helperText="Same conditions every time is what makes the line mean something."
        onValueChanged={setWeightKilograms}
      />

      <div className={styles.actions}>
        <GradientButton
          tone="ghost"
          disabled={isSaving}
          onClick={() => {
            setIsOpen(false);
          }}
        >
          Cancel
        </GradientButton>

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
      </div>

      {saveErrorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {saveErrorMessage}
        </p>
      ) : null}
    </GradientSurface>
  );
}
