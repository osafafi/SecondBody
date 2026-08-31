import styles from './NumberField.module.css';

export type NumberFieldProps = {
  label: string;

  /** Null while the field is empty, which is distinct from a typed zero. */
  value: number | null;

  /**
   * Shown inside the field, e.g. "kg".
   *
   * Explicitly `| undefined` because `exactOptionalPropertyTypes` is on: a
   * caller whose unit is optional in its own data has to be able to pass the
   * result straight through.
   */
  unitLabel?: string | undefined;

  /**
   * Keeps the label for screen readers but takes it off the screen.
   *
   * For a field sitting in a row that already names it — the habit checklist —
   * where drawing the label again would say "Steps" twice in one line. The
   * label still exists: a number field announced as nothing is a number field
   * nobody can use.
   */
  isLabelVisuallyHidden?: boolean;

  onValueChanged: (value: number | null) => void;
};

/**
 * A number typed in rather than stepped to.
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
 *
 * Use `NumberStepper` instead wherever the number is being nudged rather than
 * entered — mid-set, a keyboard covering half the screen is the wrong trade.
 * This is for the values typed once and then left alone: a height, a target
 * weight, last night's sleep.
 */
export function NumberField({
  label,
  value,
  unitLabel,
  isLabelVisuallyHidden = false,
  onValueChanged,
}: NumberFieldProps) {
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
      <span className={isLabelVisuallyHidden ? styles.visuallyHiddenLabel : styles.label}>
        {label}
      </span>

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
