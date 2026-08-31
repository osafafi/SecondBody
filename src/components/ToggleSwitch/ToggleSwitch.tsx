import styles from './ToggleSwitch.module.css';

export type ToggleSwitchProps = {
  label: string;

  /** A line under the label saying what turning it off actually does. */
  description?: string | undefined;

  isOn: boolean;

  /** Presses do nothing while true, e.g. mid-save. */
  isDisabled?: boolean | undefined;

  onToggled: (isOn: boolean) => void;
};

/**
 * An on/off preference.
 *
 * A real `<input type="checkbox">` with `role="switch"`, not a styled div: the
 * browser then handles the keyboard, and a screen reader says "on"/"off" rather
 * than "checked", which is what this control actually means. The visible track
 * and knob are drawn by the label around it.
 *
 * The description is not decoration. Every setting this is used for turns
 * something off, and "Rest timer sound" alone does not tell you whether the app
 * will still count down silently.
 */
export function ToggleSwitch({
  label,
  description,
  isOn,
  isDisabled = false,
  onToggled,
}: ToggleSwitchProps) {
  return (
    <label className={[styles.row, isDisabled ? styles.isDisabled : ''].filter(Boolean).join(' ')}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description ? <span className={styles.description}>{description}</span> : null}
      </span>

      <input
        className={styles.hiddenCheckbox}
        type="checkbox"
        role="switch"
        checked={isOn}
        disabled={isDisabled}
        onChange={(event) => {
          onToggled(event.target.checked);
        }}
      />

      <span
        className={[styles.track, isOn ? styles.isOn : ''].filter(Boolean).join(' ')}
        aria-hidden
      >
        <span className={styles.knob} />
      </span>
    </label>
  );
}
