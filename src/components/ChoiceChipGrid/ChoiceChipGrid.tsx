import styles from './ChoiceChipGrid.module.css';

export type ChoiceChipOption = {
  optionId: string;
  label: string;
};

export type ChoiceChipGridProps = {
  /** Names the group for screen readers, via the fieldset's legend. */
  legend: string;

  options: ChoiceChipOption[];
  selectedOptionIds: string[];
  onOptionToggled: (optionId: string) => void;
};

/**
 * A grid of multi-select chips: pain areas, gym equipment, training days.
 *
 * Real checkboxes inside a fieldset rather than styled buttons: the browser then
 * handles keyboard operation and announces "checked", and a group of related
 * checkboxes is exactly what this is. The input itself is visually hidden and
 * the label is what gets drawn.
 *
 * This lived in `features/onboarding/` until M8, when Settings needed the same
 * control to edit the same three answers. Two features cannot import from each
 * other, and a copy of it would be a second place for the focus ring to be
 * wrong, so it moved here.
 */
export function ChoiceChipGrid({
  legend,
  options,
  selectedOptionIds,
  onOptionToggled,
}: ChoiceChipGridProps) {
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
