import { findExerciseById } from '@/content/exercises/allExercises';
import {
  findPhaseForWeekNumber,
  findProgramWeek,
  findSessionTemplate,
} from '@/domain/programPhases';
import { isExerciseSlotAvailable } from '@/domain/sessionPlanning';
import type { ProgramTemplate } from '@/types/programTypes';
import type { PainArea, SessionLetter } from '@/types/trainingVocabulary';

/**
 * What the session due next contains, without prescribing any of it.
 *
 * The Today screen shows movements and never weights — every number is decided
 * when the session opens, against history read at that moment, and a weight
 * shown a day early would be a second opinion nobody asked for. So this reads
 * the programme content and stops there.
 *
 * The one thing it does borrow from the planner is
 * `isExerciseSlotAvailable`, so that the movements listed here are exactly the
 * movements the session will contain. A slot the pain conditions drop must not
 * appear on the dashboard and then be missing from the session.
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

export type DueSessionOutlineInput = {
  programTemplate: ProgramTemplate;
  weekNumber: number;
  sessionLetter: SessionLetter;

  /** From the profile. Drops the slots that need an area to be clear. */
  activePainAreas: PainArea[];

  /** From the profile. A hard blacklist that beats everything. */
  excludedExerciseIds: string[];
};

/** Null when the week and letter name a session this programme does not have. */
export function resolveDueSessionOutline(input: DueSessionOutlineInput): DueSessionOutline | null {
  const { programTemplate, weekNumber, sessionLetter, activePainAreas, excludedExerciseIds } =
    input;

  const phase = findPhaseForWeekNumber(programTemplate, weekNumber);
  const week = findProgramWeek(programTemplate, weekNumber);
  const sessionTemplate = phase ? findSessionTemplate(phase, sessionLetter) : null;

  if (!phase || !week || !sessionTemplate) {
    return null;
  }

  const movementNames = sessionTemplate.exerciseSlots
    .filter((slot) => isExerciseSlotAvailable(slot, activePainAreas, excludedExerciseIds))
    .slice()
    .sort((firstSlot, secondSlot) => firstSlot.orderIndex - secondSlot.orderIndex)
    .map((slot) => findExerciseById(slot.exerciseId)?.displayName ?? slot.exerciseId);

  return {
    sessionLetter,
    displayName: sessionTemplate.displayName,
    summary: sessionTemplate.summary,

    weekNumber,
    totalWeekCount: programTemplate.totalWeekCount,
    phaseDisplayName: phase.displayName,

    isDeloadWeek: week.isDeloadWeek,
    isCalibrationWeek: week.isCalibrationWeek,

    movementNames,
  };
}
