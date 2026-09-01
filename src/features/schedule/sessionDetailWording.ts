import type { ExercisePrescription } from '@/types/programTypes';
import type { PerformedSet } from '@/types/trainingHistoryTypes';

/**
 * The labels the day view uses: what a logged set says, and what a planned slot
 * says before there is a set to say anything about.
 *
 * Presentation only, and no tone. Harout's copy lives in
 * `src/content/coachVoice/` — nothing here has an opinion about a session that
 * went badly, it just writes down what happened.
 *
 * `activeSession/prescriptionWording.ts` reads a `PlannedPrescription`, which is
 * a *resolved* prescription with a real weight in it. This reads the programme
 * template's `ExercisePrescription`, which has none. They are two different
 * shapes answering two different questions, and features may not import from
 * each other in any case — see CLAUDE.md section 3.
 */

const DURATION_MINUTES_FORMATTER = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
});

const VOLUME_FORMATTER = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

/** "8–12", or "10" when both ends agree. */
export function describeRepRange(minimumReps: number, maximumReps: number): string {
  return minimumReps === maximumReps
    ? String(maximumReps)
    : `${String(minimumReps)}–${String(maximumReps)}`;
}

/**
 * What a planned slot asks for, with no weight in it.
 *
 * **No weight, deliberately.** The number on the bar is decided when the session
 * opens, against history read at that moment — see the note at the top of
 * `src/domain/plannedSessionOutline.ts`. A weight shown on a preview would be a
 * guess that had already changed by the time it was acted on.
 */
export function describePlannedPrescription(
  prescription: ExercisePrescription,
  workingSetCount: number,
): string {
  const setCount = String(workingSetCount);

  switch (prescription.kind) {
    case 'weightAndReps':
    case 'bodyweightReps': {
      const reps = describeRepRange(
        prescription.repRange.minimumReps,
        prescription.repRange.maximumReps,
      );

      return `${setCount} × ${reps}${prescription.isPerSide ? ' per side' : ''}`;
    }

    case 'loadedCarry':
      return `${setCount} × ${String(prescription.distanceMetresPerSet)} m`;

    case 'steadyStateCardio':
      return `${String(prescription.durationMinutes)} min · ${prescription.machineSettingsNote}`;
  }
}

/**
 * One logged set: "40 kg × 12", or "× 12" when the movement carries no weight.
 *
 * A weightless movement is written without a weight rather than with a zero. A
 * dead bug loaded to 0 kg is a lie, and it is the same lie
 * `PerformedSet.actualWeightKilograms` is nullable to avoid.
 */
export function describePerformedSet(performedSet: PerformedSet): string {
  const reps = `${String(performedSet.actualReps)} reps`;

  return performedSet.actualWeightKilograms === null
    ? reps
    : `${String(performedSet.actualWeightKilograms)} kg × ${String(performedSet.actualReps)}`;
}

/**
 * How the set went against what was asked for, or null when it went to plan.
 *
 * Only rendered when there is a difference, because "as prescribed" beside every
 * set of every session is noise that hides the one set that was not.
 */
export function describeSetAgainstPrescription(performedSet: PerformedSet): string | null {
  const differences: string[] = [];

  if (
    performedSet.prescribedWeightKilograms !== null &&
    performedSet.actualWeightKilograms !== null &&
    performedSet.actualWeightKilograms !== performedSet.prescribedWeightKilograms
  ) {
    differences.push(`asked for ${String(performedSet.prescribedWeightKilograms)} kg`);
  }

  if (performedSet.actualReps !== performedSet.prescribedReps) {
    differences.push(`asked for ${String(performedSet.prescribedReps)} reps`);
  }

  return differences.length === 0 ? null : differences.join(', ');
}

/** "52 min", or null when the session never recorded a duration. */
export function describeSessionDuration(durationSeconds: number | null): string | null {
  if (durationSeconds === null || durationSeconds <= 0) {
    return null;
  }

  const wholeMinutes = Math.round(durationSeconds / 60);

  return `${DURATION_MINUTES_FORMATTER.format(wholeMinutes)} min`;
}

/** "3,240 kg" — the session's total, already denormalised on the document. */
export function describeSessionVolume(totalVolumeKilograms: number): string {
  return `${VOLUME_FORMATTER.format(totalVolumeKilograms)} kg`;
}

/** "4 sets", "1 set". */
export function describeSetCount(setCount: number): string {
  return setCount === 1 ? '1 set' : `${String(setCount)} sets`;
}
