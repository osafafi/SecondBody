import styles from './OnboardingNumberField.module.css';

export type OnboardingNumberFieldProps = {
  label: string;

  /** Null while the field is empty, which is distinct from a typed zero. */
  value: number | null;

  /** Shown inside the field, e.g. "kg". */
  unitLabel?: string;

  onValueChanged: (value: number | null) => void;
};

/**
 * A number question in the onboarding form.
 *
 * The whole reason this exists rather than a bare `<input type="number">` is the
 * empty-versus-zero distinction. `event.target.value` is `''` for a cleared
 * field, and `Number('')` is 0 — so the obvious implementation silently turns a
 * blank height into a height of zero, which then passes any check that only
 * looks for a number.
 *
 * `inputMode="decimal"` rather than `type="number"` so phones show a numeric
 * keypad without also adding spinner arrows and scroll-to-change, both of which
 * are easy to trigger by accident on a touchscreen.
 */
export function OnboardingNumberField({
  label,
  value,
  unitLabel,
  onValueChanged,
}: OnboardingNumberFieldProps) {
  const handleChanged = (rawValue: string) => {
    const trimmedValue = rawValue.trim();

    if (trimmedValue.length === 0) {
      onValueChanged(null);

      return;
    }

    const parsedValue = Number(trimmedValue);

    // Keep the last good number rather than flickering to null mid-typing on
    // something like "17." which is not yet a number but is on its way to one.
    if (Number.isFinite(parsedValue)) {
      onValueChanged(parsedValue);
    }
  };

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>

      <span className={styles.inputRow}>
        <input
          className={styles.input}
          inputMode="decimal"
          value={value === null ? '' : String(value)}
          onChange={(event) => {
            handleChanged(event.target.value);
          }}
        />
        {unitLabel ? <span className={styles.unit}>{unitLabel}</span> : null}
      </span>
    </label>
  );
}
