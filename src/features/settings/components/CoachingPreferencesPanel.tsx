import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { ToggleSwitch } from '@/components/ToggleSwitch/ToggleSwitch';
import { COACH_VERBOSITY_LEVELS, type CoachVerbosityLevel } from '@/types/coachVoiceTypes';
import type { UserSettings } from '@/types/userAccountTypes';

import styles from './CoachingPreferencesPanel.module.css';

/** What each verbosity setting actually gets you, in Harout's own terms. */
const VERBOSITY_DESCRIPTIONS: Record<CoachVerbosityLevel, { label: string; hint: string }> = {
  minimal: { label: 'Minimal', hint: 'The essentials, and quiet otherwise.' },
  standard: { label: 'Standard', hint: 'A word when there is something worth saying.' },
  detailed: { label: 'Detailed', hint: 'The full commentary, reasons included.' },
};

export type CoachingPreferencesPanelProps = {
  userSettings: UserSettings;

  isSaving: boolean;

  saveErrorMessage: string | null;

  onSettingsChanged: (changes: Partial<Omit<UserSettings, 'updatedAt'>>) => void;
};

/**
 * How much of the coach you want, and what the session player does with the
 * phone while you train.
 *
 * These three preferences have been read by the app since M4 and set by nothing
 * since M4. `selectCoachLine` filters every line in the app by the verbosity
 * here, the rest timer checks the sound switch before it chimes, and the session
 * screen checks the wake lock before it holds the display on — so all three do
 * something the moment they are changed.
 *
 * Two stored preferences are deliberately absent. `defaultRestSeconds` is not
 * offered because nothing reads it: every rest interval comes from the
 * programme's own `restSecondsBetweenSets`. `weightUnit` is not offered because
 * nothing renders it: every weight in the app is shown in kilograms. A switch
 * that changes nothing is worse than no switch, so they wait until there is
 * something behind them.
 */
export function CoachingPreferencesPanel({
  userSettings,
  isSaving,
  saveErrorMessage,
  onSettingsChanged,
}: CoachingPreferencesPanelProps) {
  return (
    <GradientSurface as="section" variant="elevated" radius="xlarge" className={styles.panel}>
      <fieldset className={styles.verbosityFieldset}>
        <legend className={styles.legend}>How much Harout says</legend>

        <div className={styles.verbosityOptions}>
          {COACH_VERBOSITY_LEVELS.map((verbosityLevel) => {
            const isSelected = userSettings.coachVerbosity === verbosityLevel;
            const { label, hint } = VERBOSITY_DESCRIPTIONS[verbosityLevel];

            return (
              <label
                key={verbosityLevel}
                className={[styles.verbosityOption, isSelected ? styles.isSelected : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {/*
                 * Real radios in a fieldset, hidden from view but not from the
                 * keyboard: arrow keys move between them and the group is
                 * announced as one question, which is what it is.
                 */}
                <input
                  className={styles.hiddenRadio}
                  type="radio"
                  name="coach-verbosity"
                  value={verbosityLevel}
                  checked={isSelected}
                  disabled={isSaving}
                  onChange={() => {
                    onSettingsChanged({ coachVerbosity: verbosityLevel });
                  }}
                />

                <span className={styles.verbosityLabel}>{label}</span>
                <span className={styles.verbosityHint}>{hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.switches}>
        <ToggleSwitch
          label="Rest timer sound"
          description="A chime when the rest between sets is up. The countdown runs either way."
          isOn={userSettings.shouldPlayRestTimerSound}
          isDisabled={isSaving}
          onToggled={(shouldPlayRestTimerSound) => {
            onSettingsChanged({ shouldPlayRestTimerSound });
          }}
        />

        <ToggleSwitch
          label="Keep the screen awake"
          description="Holds the display on during a session, so it is not locked between sets. Costs battery."
          isOn={userSettings.shouldKeepScreenAwakeDuringSession}
          isDisabled={isSaving}
          onToggled={(shouldKeepScreenAwakeDuringSession) => {
            onSettingsChanged({ shouldKeepScreenAwakeDuringSession });
          }}
        />
      </div>

      {saveErrorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {saveErrorMessage}
        </p>
      ) : null}
    </GradientSurface>
  );
}
