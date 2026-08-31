import { useState } from 'react';
import { Activity, Beef, Check, CupSoda, Footprints, ListChecks, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { NumberField } from '@/components/NumberField/NumberField';
import { dailyHabitDefinitions } from '@/content/habits/dailyHabitDefinitions';
import type { DailyHabitSummary, RecentHabitCompliance } from '@/domain/habitCompliance';
import type { CoachLine } from '@/types/coachVoiceTypes';
import type { DailyHabitRecord } from '@/types/dailyTrackingTypes';
import type { DailyHabitDefinition, DailyHabitId } from '@/types/habitTypes';

import styles from './DailyHabitChecklistPanel.module.css';
import {
  describeHabitAnswer,
  describeHabitStreak,
  describeHabitTarget,
  describeHabitsSoFarToday,
  describeRecentHabitCompliance,
} from '../habitWording';

/** Days of history before the "x of the last y days" line is worth showing. */
const MINIMUM_DAYS_BEFORE_REPORTING_COMPLIANCE = 7;

const HABIT_ICONS: Record<DailyHabitId, LucideIcon> = {
  didHitProteinTarget: Beef,
  stepCount: Footprints,
  didAvoidLiquidCalories: CupSoda,
  sleepHours: Moon,
  didCompleteMobilityRoutine: Activity,
};

/** The answer this row is holding, whichever of the two kinds it is. */
type HabitAnswerChanges = Partial<Omit<DailyHabitRecord, 'onDate' | 'updatedAt'>>;

export type DailyHabitChecklistPanelProps = {
  todayHabitRecord: DailyHabitRecord;

  /** Which of the five landed today, from `src/domain/habitCompliance.ts`. */
  todaySummary: DailyHabitSummary;

  /** Today's step target. It climbs across the twelve weeks. */
  dailyStepTarget: number;

  streakLength: number;

  recentCompliance: RecentHabitCompliance;

  /** Harout on the habits, or null when there is nothing worth saying. */
  coachLine: CoachLine | null;

  isSaving: boolean;

  saveErrorMessage: string | null;

  onHabitAnswered: (changes: HabitAnswerChanges) => void;
};

/**
 * The four ticks and two numbers, on the screen they are looked at from.
 *
 * This is what M6 left a `ComingSoonPanel` standing in for. It lives on Today
 * rather than on a tab of its own because it is answered in passing — in the
 * evening, on the way past — and a habit that needs navigating to is a habit
 * that gets skipped.
 *
 * **Nothing here decides whether a habit was met.** `habitCompliance.ts` does,
 * against the target that was in force on the day, and this arranges what comes
 * back. The panel's one real piece of judgement is that an untouched day reads
 * as untouched rather than as five failures.
 */
export function DailyHabitChecklistPanel({
  todayHabitRecord,
  todaySummary,
  dailyStepTarget,
  streakLength,
  recentCompliance,
  coachLine,
  isSaving,
  saveErrorMessage,
  onHabitAnswered,
}: DailyHabitChecklistPanelProps) {
  const streakDescription = describeHabitStreak(streakLength);

  const complianceDescription = describeRecentHabitCompliance(
    recentCompliance,
    MINIMUM_DAYS_BEFORE_REPORTING_COMPLIANCE,
  );

  /* Both are null often enough that the line has to be able to disappear. */
  const subtitleParts = [streakDescription, complianceDescription].filter(
    (part): part is string => part !== null,
  );

  const orderedHabitDefinitions = [...dailyHabitDefinitions].sort(
    (left, right) => left.orderIndex - right.orderIndex,
  );

  return (
    <GradientSurface as="section" variant="recessed" radius="xlarge" className={styles.panel}>
      <header className={styles.header}>
        <IconBadge icon={<ListChecks size={22} strokeWidth={1.75} />} />

        <div className={styles.headlineText}>
          <span className={styles.eyebrow}>Daily habits</span>
          <h2 className={styles.title}>{describeHabitsSoFarToday(todaySummary)}</h2>

          {subtitleParts.length > 0 ? (
            <p className={styles.subtitle}>{subtitleParts.join(' · ')}</p>
          ) : null}
        </div>
      </header>

      <ul className={styles.habitList}>
        {orderedHabitDefinitions.map((habitDefinition) =>
          habitDefinition.answerKind === 'checkbox' ? (
            <TickableHabitRow
              key={habitDefinition.habitId}
              habitDefinition={habitDefinition}
              targetDescription={describeHabitTarget(habitDefinition, dailyStepTarget)}
              isTicked={todaySummary.metHabitIds.includes(habitDefinition.habitId)}
              isSaving={isSaving}
              onTickChanged={(isTicked) => {
                onHabitAnswered({ [habitDefinition.habitId]: isTicked });
              }}
            />
          ) : (
            <NumericHabitRow
              /*
               * Keyed by the saved value as well as the habit, so that a value
               * arriving from Firestore — or a rolled-back write — replaces the
               * row rather than leaving a stale draft in a field the user is no
               * longer editing. Remounting is the honest way to reset local
               * state from props; an effect that copies props into state is the
               * way that ends up one render behind.
               */
              key={`${habitDefinition.habitId}-${String(readNumericAnswer(todayHabitRecord, habitDefinition.habitId))}`}
              habitDefinition={habitDefinition}
              savedValue={readNumericAnswer(todayHabitRecord, habitDefinition.habitId)}
              isMet={todaySummary.metHabitIds.includes(habitDefinition.habitId)}
              targetDescription={describeHabitTarget(habitDefinition, dailyStepTarget)}
              isSaving={isSaving}
              onValueSaved={(value) => {
                onHabitAnswered({ [habitDefinition.habitId]: value });
              }}
            />
          ),
        )}
      </ul>

      {saveErrorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {saveErrorMessage}
        </p>
      ) : null}

      {coachLine ? <p className={styles.coachLine}>{coachLine.text}</p> : null}

      {/*
       * A single disclosure rather than one per row. Every habit has a reason
       * worth reading once and never again, and five expanders on a checklist
       * somebody ticks in fifteen seconds is four too many.
       */}
      <details className={styles.reasons}>
        <summary className={styles.reasonsSummary}>Why these five</summary>

        <dl className={styles.reasonList}>
          {orderedHabitDefinitions.map((habitDefinition) => (
            <div className={styles.reason} key={habitDefinition.habitId}>
              <dt className={styles.reasonName}>{habitDefinition.displayName}</dt>
              <dd className={styles.reasonText}>{habitDefinition.whyItMatters}</dd>
            </div>
          ))}
        </dl>
      </details>
    </GradientSurface>
  );
}

/** The two numeric habits are the only fields on the record that hold numbers. */
function readNumericAnswer(
  todayHabitRecord: DailyHabitRecord,
  habitId: DailyHabitId,
): number | null {
  return habitId === 'stepCount' ? todayHabitRecord.stepCount : todayHabitRecord.sleepHours;
}

/**
 * A habit answered with a tick.
 *
 * A real checkbox inside a label, hidden from view but not from the keyboard or
 * a screen reader — the same pattern as `ChoiceChipGrid`, for the same reason.
 * The whole row is the target, because a tick box sized for a thumb is the
 * difference between this being done and not.
 */
function TickableHabitRow({
  habitDefinition,
  targetDescription,
  isTicked,
  isSaving,
  onTickChanged,
}: {
  habitDefinition: DailyHabitDefinition;
  targetDescription: string;
  isTicked: boolean;
  isSaving: boolean;
  onTickChanged: (isTicked: boolean) => void;
}) {
  const HabitIcon = HABIT_ICONS[habitDefinition.habitId];

  return (
    <li>
      <label className={[styles.row, isTicked ? styles.isMet : ''].filter(Boolean).join(' ')}>
        <input
          className={styles.hiddenCheckbox}
          type="checkbox"
          checked={isTicked}
          disabled={isSaving}
          onChange={(event) => {
            onTickChanged(event.target.checked);
          }}
        />

        <span className={styles.rowIcon} aria-hidden>
          <HabitIcon size={18} strokeWidth={1.75} />
        </span>

        <span className={styles.rowText}>
          <span className={styles.rowName}>{habitDefinition.displayName}</span>
          <span className={styles.rowTarget}>{targetDescription}</span>
        </span>

        <span className={styles.tickBox} aria-hidden>
          {isTicked ? <Check size={16} strokeWidth={3} /> : null}
        </span>
      </label>
    </li>
  );
}

/**
 * A habit answered with a number.
 *
 * Typed rather than stepped: a step count is four or five digits and nobody is
 * pressing a plus button eight thousand times. The confirm button appears only
 * once the field holds something different from what is stored, so the row is
 * quiet when there is nothing to save and never leaves a typed number sitting
 * unsaved behind an invisible blur handler.
 */
function NumericHabitRow({
  habitDefinition,
  savedValue,
  isMet,
  targetDescription,
  isSaving,
  onValueSaved,
}: {
  habitDefinition: DailyHabitDefinition;
  savedValue: number | null;
  isMet: boolean;
  targetDescription: string;
  isSaving: boolean;
  onValueSaved: (value: number | null) => void;
}) {
  const [draftValue, setDraftValue] = useState<number | null>(savedValue);

  const HabitIcon = HABIT_ICONS[habitDefinition.habitId];
  const hasUnsavedChange = draftValue !== savedValue;

  return (
    <li>
      <div className={[styles.row, isMet ? styles.isMet : ''].filter(Boolean).join(' ')}>
        <span className={styles.rowIcon} aria-hidden>
          <HabitIcon size={18} strokeWidth={1.75} />
        </span>

        <span className={styles.rowText}>
          <span className={styles.rowName}>{habitDefinition.displayName}</span>
          <span className={styles.rowTarget}>
            {targetDescription} · {describeHabitAnswer(habitDefinition, savedValue)}
          </span>
        </span>

        <span className={styles.numericField}>
          <NumberField
            label={habitDefinition.displayName}
            value={draftValue}
            unitLabel={habitDefinition.unitLabel ?? undefined}
            isLabelVisuallyHidden
            onValueChanged={setDraftValue}
          />
        </span>
      </div>

      {hasUnsavedChange ? (
        <GradientButton
          tone="secondary"
          isFullWidth
          disabled={isSaving}
          className={styles.saveNumberButton}
          onClick={() => {
            onValueSaved(draftValue);
          }}
        >
          <Check size={16} strokeWidth={2} aria-hidden />
          Save {habitDefinition.displayName.toLowerCase()}
        </GradientButton>
      ) : null}
    </li>
  );
}
