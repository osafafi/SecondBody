import styles from './OnboardingChoiceGrid.module.css';

export type OnboardingChoiceOption = {
  optionId: string;
  label: string;
};

export type OnboardingChoiceGridProps = {
  /** Names the group for screen readers, via the fieldset's legend. */
  legend: string;

  options: OnboardingChoiceOption[];
  selectedOptionIds: string[];
  onOptionToggled: (optionId: string) => void;
};

/**
 * A grid of multi-select chips, used for pain areas, equipment and training days.
 *
 * Real checkboxes inside a fieldset rather than styled buttons: the browser then
 * handles keyboard operation and announces "checked", and a group of related
 * checkboxes is exactly what this is. The input itself is visually hidden and
 * the label is what gets drawn.
 */
export function OnboardingChoiceGrid({
  legend,
  options,
  selectedOptionIds,
  onOptionToggled,
}: OnboardingChoiceGridProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>

      <div className={styles.grid}>
        {options.map((option) => {
          const isSelected = selectedOptionIds.includes(option.optionId);

          return (
            <label
              key={option.optionId}
              className={[styles.chip, isSelected ? styles.isSelected : '']
                .filter(Boolean)
                .join(' ')}
            >
              <input
                className={styles.hiddenCheckbox}
                type="checkbox"
                checked={isSelected}
                onChange={() => {
                  onOptionToggled(option.optionId);
                }}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
