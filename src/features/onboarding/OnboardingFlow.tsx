import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

import { useAuthentication } from '@/app/useAuthentication';
import { useUserProfile } from '@/app/useUserProfile';
import { ChoiceChipGrid } from '@/components/ChoiceChipGrid/ChoiceChipGrid';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { NumberField } from '@/components/NumberField/NumberField';
import { findCoachLinesByCategory } from '@/content/coachVoice/allCoachLines';
import { gymEquipment } from '@/content/equipment/gymEquipment';
import {
  dayOfWeekChoiceOptions,
  painAreaChoiceOptions,
} from '@/content/vocabulary/trainingVocabularyLabels';
import { selectCoachLine } from '@/domain/coachLineSelection';
import {
  findOnboardingStepProblems,
  ONBOARDING_STEP_IDS,
  type OnboardingDraft,
  type OnboardingStepId,
} from '@/domain/onboardingValidation';
import { DEFAULT_TRAINING_DAYS_OF_WEEK } from '@/types/userAccountTypes';
import type { EquipmentId, PainArea } from '@/types/trainingVocabulary';

import styles from './OnboardingFlow.module.css';

/** Titles and sub-headings, one per step in `ONBOARDING_STEP_IDS` order. */
const STEP_HEADINGS: Record<OnboardingStepId, { title: string; question: string }> = {
  aboutYou: { title: 'About you', question: 'The basics the programme is built on.' },
  startingPoint: {
    title: 'Where you are',
    question: 'Where you are now, and where you want to be.',
  },
  painAreas: { title: 'What hurts', question: 'Anything sore gets worked around, not through.' },
  equipment: { title: 'Your gym', question: 'Untick anything your gym does not actually have.' },
  schedule: { title: 'When you train', question: 'Which days you plan to be in the gym.' },
};

/**
 * The five questions asked once, the first time somebody signs in.
 *
 * Validation lives in `src/domain/onboardingValidation.ts` rather than here, so
 * the rules about a plausible height and a non-empty gym are unit tested instead
 * of only being exercised by clicking through the form.
 *
 * The equipment step starts with everything ticked. The inventory in
 * `src/content/equipment/` was counted in Omar's building gym in person, so
 * "everything on this list" is the correct answer for him and untick-what-you-do
 * -not-have is less work than ticking twenty-six boxes.
 */
export function OnboardingFlow() {
  const { signedInUser } = useAuthentication();
  const { completeOnboarding } = useUserProfile();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasTriedToAdvance, setHasTriedToAdvance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const [draft, setDraft] = useState<OnboardingDraft>(() => ({
    displayName: signedInUser?.displayName ?? '',
    birthYear: null,
    heightCentimetres: null,
    startingWeightKilograms: null,
    targetWeightKilograms: null,
    painAreas: [],
    availableEquipmentIds: gymEquipment.map((equipment) => equipment.equipmentId),
    trainingDaysOfWeek: [...DEFAULT_TRAINING_DAYS_OF_WEEK],
  }));

  /*
   * Read once per render rather than inside the domain call, because
   * `src/domain/` is not allowed to read a clock — see the note on
   * `findOnboardingStepProblems`.
   */
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const currentStepId = ONBOARDING_STEP_IDS[currentStepIndex] ?? ONBOARDING_STEP_IDS[0];
  const isFinalStep = currentStepIndex === ONBOARDING_STEP_IDS.length - 1;
  const stepHeading = STEP_HEADINGS[currentStepId];

  const stepProblems = findOnboardingStepProblems(currentStepId, draft, currentYear);

  const openingCoachLine = selectCoachLine({
    candidateLines: findCoachLinesByCategory('onboardingOpening'),
    configuredVerbosity: 'standard',
    rotationIndex: currentStepIndex,
    mayUsePraise: false,
  });

  const updateDraft = (changes: Partial<OnboardingDraft>) => {
    setDraft((previousDraft) => ({ ...previousDraft, ...changes }));
  };

  /** Unconstrained, because training days are numbers and the rest are strings. */
  const toggleMember = <TMember,>(members: TMember[], member: TMember): TMember[] =>
    members.includes(member)
      ? members.filter((existing) => existing !== member)
      : [...members, member];

  const handleBackPressed = () => {
    setHasTriedToAdvance(false);
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  };

  const handleNextPressed = () => {
    if (stepProblems.length > 0) {
      setHasTriedToAdvance(true);

      return;
    }

    setHasTriedToAdvance(false);

    if (!isFinalStep) {
      setCurrentStepIndex((index) => index + 1);

      return;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);

    void completeOnboarding(draft)
      .catch((error: unknown) => {
        setSaveErrorMessage(
          error instanceof Error
            ? error.message
            : 'Could not save your profile. Check your connection and try again.',
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <main className={styles.screen}>
      <GradientSurface variant="glass" radius="xlarge" className={styles.panel}>
        <div className={styles.progressRow} aria-hidden>
          {ONBOARDING_STEP_IDS.map((stepId, stepIndex) => (
            <span
              key={stepId}
              className={[styles.progressPip, stepIndex <= currentStepIndex ? styles.isReached : '']
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>

        <header className={styles.header}>
          <p className={styles.stepCount}>
            Step {String(currentStepIndex + 1)} of {String(ONBOARDING_STEP_IDS.length)}
          </p>
          <h1 className={styles.title}>{stepHeading.title}</h1>
          <p className={styles.question}>{stepHeading.question}</p>
        </header>

        <div className={styles.fields}>
          {currentStepId === 'aboutYou' ? (
            <>
              <label className={styles.textField}>
                <span className={styles.fieldLabel}>What should I call you?</span>
                <input
                  className={styles.textInput}
                  type="text"
                  value={draft.displayName}
                  autoComplete="given-name"
                  onChange={(event) => {
                    updateDraft({ displayName: event.target.value });
                  }}
                />
              </label>

              <NumberField
                label="Year you were born"
                value={draft.birthYear}
                onValueChanged={(birthYear) => {
                  updateDraft({ birthYear });
                }}
              />

              <NumberField
                label="Height"
                unitLabel="cm"
                value={draft.heightCentimetres}
                onValueChanged={(heightCentimetres) => {
                  updateDraft({ heightCentimetres });
                }}
              />
            </>
          ) : null}

          {currentStepId === 'startingPoint' ? (
            <>
              <NumberField
                label="Weight today"
                unitLabel="kg"
                value={draft.startingWeightKilograms}
                onValueChanged={(startingWeightKilograms) => {
                  updateDraft({ startingWeightKilograms });
                }}
              />

              <NumberField
                label="Weight you are aiming for"
                unitLabel="kg"
                value={draft.targetWeightKilograms}
                onValueChanged={(targetWeightKilograms) => {
                  updateDraft({ targetWeightKilograms });
                }}
              />
            </>
          ) : null}

          {currentStepId === 'painAreas' ? (
            <ChoiceChipGrid
              legend="Anywhere that currently hurts"
              options={painAreaChoiceOptions}
              selectedOptionIds={draft.painAreas}
              onOptionToggled={(painArea) => {
                updateDraft({ painAreas: toggleMember(draft.painAreas, painArea as PainArea) });
              }}
            />
          ) : null}

          {currentStepId === 'equipment' ? (
            <ChoiceChipGrid
              legend="What your gym has"
              options={gymEquipment.map((equipment) => ({
                optionId: equipment.equipmentId,
                label: equipment.displayName,
              }))}
              selectedOptionIds={draft.availableEquipmentIds}
              onOptionToggled={(equipmentId) => {
                updateDraft({
                  availableEquipmentIds: toggleMember(
                    draft.availableEquipmentIds,
                    equipmentId as EquipmentId,
                  ),
                });
              }}
            />
          ) : null}

          {currentStepId === 'schedule' ? (
            <ChoiceChipGrid
              legend="Training days"
              options={dayOfWeekChoiceOptions}
              selectedOptionIds={draft.trainingDaysOfWeek.map(String)}
              onOptionToggled={(dayValue) => {
                updateDraft({
                  trainingDaysOfWeek: toggleMember(
                    draft.trainingDaysOfWeek,
                    Number.parseInt(dayValue, 10),
                  ).sort((left, right) => left - right),
                });
              }}
            />
          ) : null}
        </div>

        {/*
         * Problems appear only after a first attempt to move on. Complaining
         * about an empty field before it has been reached is the form telling
         * someone off for not having answered a question yet.
         */}
        {hasTriedToAdvance && stepProblems.length > 0 ? (
          <ul className={styles.problems} role="alert">
            {stepProblems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        ) : null}

        {saveErrorMessage ? (
          <p className={styles.problems} role="alert">
            {saveErrorMessage}
          </p>
        ) : null}

        <div className={styles.actions}>
          {currentStepIndex > 0 ? (
            <GradientButton
              tone="ghost"
              onClick={handleBackPressed}
              disabled={isSaving}
              leadingIcon={<ArrowLeft size={16} strokeWidth={2} aria-hidden />}
            >
              Back
            </GradientButton>
          ) : null}

          <GradientButton
            tone="primary"
            isFullWidth={currentStepIndex === 0}
            onClick={handleNextPressed}
            disabled={isSaving}
            trailingIcon={
              isFinalStep ? (
                <Check size={16} strokeWidth={2} aria-hidden />
              ) : (
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              )
            }
          >
            {isFinalStep ? (isSaving ? 'Saving…' : 'Done') : 'Next'}
          </GradientButton>
        </div>

        {openingCoachLine ? <p className={styles.coachLine}>{openingCoachLine.text}</p> : null}
      </GradientSurface>
    </main>
  );
}
