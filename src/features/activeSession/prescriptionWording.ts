import type { PlannedExercise, PlannedPrescription } from '@/domain/sessionPlanning';
import type { RepRange } from '@/types/trainingVocabulary';

/**
 * Putting a prescription into words.
 *
 * Not coach copy — Harout's lines all live in `src/content/coachVoice/`. This is
 * the interface reading a number out loud: "30 kg", "2 sets of 10 to 12". It is
 * shared because the brief, the set itself and the summary all have to say the
 * same thing the same way.
 */

/** The headline number: what goes on the machine, or how long to walk for. */
export type PrescriptionHeadline = {
  /** The big number, or a word when there is no number. */
  value: string;

  /** What the number is in. Empty when the value says everything. */
  unit: string;

  /** The line under it: sets, reps, distance, machine settings. */
  detail: string;
};

function describeRepRange(repRange: RepRange, isPerSide: boolean): string {
  const perSideSuffix = isPerSide ? ' per side' : '';

  if (repRange.minimumReps === repRange.maximumReps) {
    return `${String(repRange.maximumReps)} reps${perSideSuffix}`;
  }

  return `${String(repRange.minimumReps)} to ${String(repRange.maximumReps)} reps${perSideSuffix}`;
}

function describeSetCount(workingSetCount: number): string {
  return workingSetCount === 1 ? '1 set' : `${String(workingSetCount)} sets`;
}

export function describePrescriptionHeadline(
  plannedExercise: PlannedExercise,
): PrescriptionHeadline {
  const { prescription, workingSetCount } = plannedExercise;

  switch (prescription.kind) {
    case 'weightAndReps':
      return {
        value: String(prescription.prescribedWeightKilograms),
        unit: 'kg',
        detail: `${describeSetCount(workingSetCount)} of ${describeRepRange(
          prescription.repRange,
          prescription.isPerSide,
        )}`,
      };

    case 'bodyweightReps':
      return {
        value: 'Bodyweight',
        unit: '',
        detail: `${describeSetCount(workingSetCount)} of ${describeRepRange(
          prescription.repRange,
          prescription.isPerSide,
        )}`,
      };

    case 'loadedCarry':
      return {
        value: String(prescription.prescribedWeightKilograms),
        unit: 'kg each hand',
        detail: `${describeSetCount(workingSetCount)} of ${String(
          prescription.distanceMetresPerSet,
        )} m`,
      };

    case 'steadyStateCardio':
      return {
        value: String(prescription.durationMinutes),
        unit: 'min',
        detail: prescription.machineSettingsNote,
      };
  }
}

/**
 * What one set of this asks for, without repeating the set count.
 *
 * The set-in-progress screen already says "SET 2 OF 2" above it, so saying "2
 * sets of" underneath is the same fact twice on a screen that is being read
 * mid-effort.
 */
export function describeSetTarget(plannedExercise: PlannedExercise): string {
  const { prescription } = plannedExercise;

  switch (prescription.kind) {
    case 'weightAndReps':
    case 'bodyweightReps':
      return describeRepRange(prescription.repRange, prescription.isPerSide);

    case 'loadedCarry':
      return `${String(prescription.distanceMetresPerSet)} m`;

    case 'steadyStateCardio':
      return prescription.machineSettingsNote;
  }
}

/**
 * How the weight has moved since last time, or null when it has not.
 *
 * Deliberately says nothing when the load is unchanged. That is most exercises
 * in most sessions, and announcing it every time is how a screen stops being
 * read.
 *
 * The direction comes with the words so the icon beside them cannot disagree —
 * an up arrow next to "down 4 kg" is worse than no arrow at all.
 */
export type LoadChangeDescription = {
  text: string;
  direction: 'up' | 'down' | 'firstTime';
};

export function describeLoadChange(
  prescription: PlannedPrescription,
): LoadChangeDescription | null {
  if (prescription.kind !== 'weightAndReps' && prescription.kind !== 'loadedCarry') {
    return null;
  }

  const changeKilograms = String(Math.abs(prescription.changeFromPreviousKilograms));

  switch (prescription.loadDecisionReason) {
    case 'firstTimeCalibration':
      return { text: 'First time on this one', direction: 'firstTime' };

    case 'increasedAfterFullRange':
      return { text: `Up ${changeKilograms} kg on last time`, direction: 'up' };

    case 'reducedAfterBrutalSet':
      return { text: `Down ${changeKilograms} kg — last one was brutal`, direction: 'down' };

    case 'reducedAfterSharpPain':
      return { text: `Down ${changeKilograms} kg — that one hurt last time`, direction: 'down' };

    case 'held':
      return null;
  }
}

/** The label on the count control: what the number being logged actually counts. */
export const SET_COUNT_UNIT_LABELS = {
  reps: 'reps',
  repsPerSide: 'reps per side',
  metres: 'metres',
  minutes: 'minutes',
} as const;
