import { findExerciseById } from '@/content/exercises/allExercises';
import {
  buildPlannedSessionOutline,
  type PlannedSessionOutlineInput,
} from '@/domain/plannedSessionOutline';
import type { SessionLetter } from '@/types/trainingVocabulary';

/**
 * What the session due next contains, without prescribing any of it.
 *
 * The rules — which slots the pain areas drop, what order they come in, and the
 * fact that no weight comes out of any of it — moved to
 * `src/domain/plannedSessionOutline.ts` when the Schedule screen needed to ask
 * the same question about any day rather than only about today. Features may not
 * import from each other, so the shared part is in the domain and this is the
 * short adapter that turns exercise ids into the names Today puts on screen.
 */

export type DueSessionOutline = {
  sessionLetter: SessionLetter;
  displayName: string;
  summary: string;

  weekNumber: number;
  totalWeekCount: number;
  phaseDisplayName: string;

  isDeloadWeek: boolean;
  isCalibrationWeek: boolean;

  /** Display names, in the order the session performs them. */
  movementNames: string[];
};

export type DueSessionOutlineInput = PlannedSessionOutlineInput;

/** Null when the week and letter name a session this programme does not have. */
export function resolveDueSessionOutline(input: DueSessionOutlineInput): DueSessionOutline | null {
  const plannedSession = buildPlannedSessionOutline(input);

  if (!plannedSession) {
    return null;
  }

  return {
    sessionLetter: plannedSession.sessionLetter,
    displayName: plannedSession.displayName,
    summary: plannedSession.summary,

    weekNumber: plannedSession.weekNumber,
    totalWeekCount: plannedSession.totalWeekCount,
    phaseDisplayName: plannedSession.phaseDisplayName,

    isDeloadWeek: plannedSession.isDeloadWeek,
    isCalibrationWeek: plannedSession.isCalibrationWeek,

    movementNames: plannedSession.slots.map(
      (slot) => findExerciseById(slot.exerciseId)?.displayName ?? slot.exerciseId,
    ),
  };
}
