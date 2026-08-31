import { useState } from 'react';
import { Check } from 'lucide-react';

import { ChoiceChipGrid } from '@/components/ChoiceChipGrid/ChoiceChipGrid';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { NumberField } from '@/components/NumberField/NumberField';
import {
  dayOfWeekChoiceOptions,
  painAreaChoiceOptions,
} from '@/content/vocabulary/trainingVocabularyLabels';
import {
  findProfileEditProblems,
  hasProfileEdits,
  readEditableProfileFields,
  type EditableProfileFields,
} from '@/domain/profileEditing';
import type { PainArea } from '@/types/trainingVocabulary';
import type { UserProfile } from '@/types/userAccountTypes';

import styles from './ProfileDetailsPanel.module.css';

export type ProfileDetailsPanelProps = {
  userProfile: UserProfile;

  isSaving: boolean;

  saveErrorMessage: string | null;

  hasJustSaved: boolean;

  onProfileSaved: (edits: EditableProfileFields) => void;

  /** Called on the first keystroke after a save, to clear the "Saved" note. */
  onEditStarted: () => void;
};

/**
 * The answers onboarding collected, months later.
 *
 * The rules are not here. `src/domain/profileEditing.ts` decides what may be
 * changed, what counts as a change and what a valid answer looks like — and it
 * shares its bounds with the onboarding form, so the two cannot disagree about
 * a plausible height.
 *
 * Problems are only shown after a save is attempted. Complaining about a field
 * that is halfway through being retyped is the form telling somebody off for
 * not having finished a sentence.
 */
export function ProfileDetailsPanel({
  userProfile,
  isSaving,
  saveErrorMessage,
  hasJustSaved,
  onProfileSaved,
  onEditStarted,
}: ProfileDetailsPanelProps) {
  const [edits, setEdits] = useState<EditableProfileFields>(() =>
    readEditableProfileFields(userProfile),
  );

  const [hasTriedToSave, setHasTriedToSave] = useState(false);

  const problems = findProfileEditProblems(edits);
  const hasUnsavedChanges = hasProfileEdits(userProfile, edits);

  const updateEdits = (changes: Partial<EditableProfileFields>) => {
    onEditStarted();
    setEdits((previousEdits) => ({ ...previousEdits, ...changes }));
  };

  /** Unconstrained, because training days are numbers and pain areas are strings. */
  const toggleMember = <TMember,>(members: TMember[], member: TMember): TMember[] =>
    members.includes(member)
      ? members.filter((existing) => existing !== member)
      : [...members, member];

  const handleSavePressed = () => {
    if (problems.length > 0) {
      setHasTriedToSave(true);

      return;
    }

    setHasTriedToSave(false);
    onProfileSaved(edits);
  };

  return (
    <GradientSurface as="section" variant="elevated" radius="xlarge" className={styles.panel}>
      <label className={styles.textField}>
        <span className={styles.fieldLabel}>What Harout calls you</span>
        <input
          className={styles.textInput}
          type="text"
          value={edits.displayName}
          autoComplete="given-name"
          onChange={(event) => {
            updateEdits({ displayName: event.target.value });
          }}
        />
      </label>

      <NumberField
        label="Height"
        unitLabel="cm"
        value={edits.heightCentimetres}
        onValueChanged={(heightCentimetres) => {
          updateEdits({ heightCentimetres });
        }}
      />

      <NumberField
        label="Weight you are aiming for"
        unitLabel="kg"
        value={edits.targetWeightKilograms}
        onValueChanged={(targetWeightKilograms) => {
          updateEdits({ targetWeightKilograms });
        }}
      />

      <ChoiceChipGrid
        legend="Training days"
        options={dayOfWeekChoiceOptions}
        selectedOptionIds={edits.trainingDaysOfWeek.map(String)}
        onOptionToggled={(dayValue) => {
          updateEdits({
            trainingDaysOfWeek: toggleMember(
              edits.trainingDaysOfWeek,
              Number.parseInt(dayValue, 10),
            ).sort((left, right) => left - right),
          });
        }}
      />

      <ChoiceChipGrid
        legend="Anywhere that currently hurts"
        options={painAreaChoiceOptions}
        selectedOptionIds={edits.painAreas}
        onOptionToggled={(painArea) => {
          updateEdits({ painAreas: toggleMember(edits.painAreas, painArea as PainArea) });
        }}
      />

      {/*
       * Said once, plainly, rather than leaving somebody hunting for a field
       * that is not here. The reasons are in `profileEditing.ts`.
       */}
      <p className={styles.fixedFieldsNote}>
        Your starting weight and your gym&rsquo;s equipment are set at onboarding and stay put — the
        weight trend is measured from one and every prescription is built on the other.
      </p>

      {hasTriedToSave && problems.length > 0 ? (
        <ul className={styles.problems} role="alert">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      {saveErrorMessage ? (
        <p className={styles.problems} role="alert">
          {saveErrorMessage}
        </p>
      ) : null}

      <div className={styles.saveRow}>
        <GradientButton
          tone="primary"
          isFullWidth
          disabled={isSaving || !hasUnsavedChanges}
          onClick={handleSavePressed}
        >
          <Check size={18} strokeWidth={2} aria-hidden />
          {isSaving ? 'Saving' : 'Save changes'}
        </GradientButton>
      </div>

      {hasJustSaved && !hasUnsavedChanges ? (
        <p className={styles.savedNote} role="status">
          Saved.
        </p>
      ) : null}
    </GradientSurface>
  );
}
