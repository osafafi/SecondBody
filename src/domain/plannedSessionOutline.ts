import type { ExercisePrescription, ProgramTemplate } from '@/types/programTypes';
import type { EffortTargetRange, PainArea, SessionLetter } from '@/types/trainingVocabulary';

import { findPhaseForWeekNumber, findProgramWeek, findSessionTemplate } from './programPhases';
import { isExerciseSlotAvailable } from './sessionPlanning';

/**
 * What a session contains, without prescribing any of it.
 *
 * **No weight comes out of here, and that is the whole point.** Every number the
 * app puts on a bar is decided by `resolveSessionPlan` at the moment a session
 * opens, against history read at that moment. A weight shown a day early would
 * be a second opinion nobody asked for, and one that had already changed by the
 * time it was acted on. So this reads the programme content, says which
 * movements are in, how many sets and what rep range — and stops.
 *
 * The one thing it borrows from the planner is `isExerciseSlotAvailable`, so
 * that the movements listed here are exactly the movements the session will
 * contain. A slot the pain conditions drop must not appear on a preview and then
 * be missing from the session itself.
 *
 * It lives in `src/domain/` rather than in a feature because two features now
 * ask this question — Today, about the session due next, and Schedule, about any
 * day you tap on — and features may not import from each other. It resolves no
 * display names for the same reason: exercise ids come out, and each screen
 * looks the names up in `src/content/` itself, which keeps this layer free of
 * content the way the dependency rule in CLAUDE.md section 3 asks.
 */

export type PlannedSessionSlotOutline = {
  /** 1-based position in the session. Slots come out already in this order. */
  orderIndex: number;

  exerciseId: string;

  /**
   * Straight off the programme template, so a consumer can say "3 sets of 8 to
   * 12" without a second lookup. The `startingWeightKilograms` inside it is the
   * content's first-time value and is **not** what will be prescribed — see the
   * note at the top.
   */
  prescription: ExercisePrescription;

  restSecondsBetweenSets: number;

  /** A note about this slot rather than about the exercise. Usually null. */
  slotNote: string | null;
};

export type PlannedSessionOutline = {
  sessionLetter: SessionLetter;
  displayName: string;
  summary: string;

  weekNumber: number;
  totalWeekCount: number;

  phaseNumber: number;
  phaseDisplayName: string;
  phaseSummary: string;
  targetEffortRange: EffortTargetRange;

  /** Working sets per exercise this week. The warm-up ramp set is not counted. */
  workingSetCount: number;

  isDeloadWeek: boolean;
  isCalibrationWeek: boolean;

  /** The week's own note, when it has one worth reading before it starts. */
  weekNote: string | null;

  /** In the order the session performs them, pain-area exclusions already applied. */
  slots: PlannedSessionSlotOutline[];
};

export type PlannedSessionOutlineInput = {
  programTemplate: ProgramTemplate;
  weekNumber: number;
  sessionLetter: SessionLetter;

  /** From the profile. Drops the slots that need an area to be clear. */
  activePainAreas: PainArea[];

  /** From the profile. A hard blacklist that beats everything. */
  excludedExerciseIds: string[];
};

/** Null when the week and letter name a session this programme does not have. */
export function buildPlannedSessionOutline(
  input: PlannedSessionOutlineInput,
): PlannedSessionOutline | null {
  const { programTemplate, weekNumber, sessionLetter, activePainAreas, excludedExerciseIds } =
    input;

  const phase = findPhaseForWeekNumber(programTemplate, weekNumber);
  const week = findProgramWeek(programTemplate, weekNumber);
  const sessionTemplate = phase ? findSessionTemplate(phase, sessionLetter) : null;

  if (!phase || !week || !sessionTemplate) {
    return null;
  }

  const slots: PlannedSessionSlotOutline[] = sessionTemplate.exerciseSlots
    .filter((slot) => isExerciseSlotAvailable(slot, activePainAreas, excludedExerciseIds))
    .slice()
    .sort((firstSlot, secondSlot) => firstSlot.orderIndex - secondSlot.orderIndex)
    .map((slot) => ({
      orderIndex: slot.orderIndex,
      exerciseId: slot.exerciseId,
      prescription: slot.prescription,
      restSecondsBetweenSets: slot.restSecondsBetweenSets,
      slotNote: slot.slotNote,
    }));

  return {
    sessionLetter,
    displayName: sessionTemplate.displayName,
    summary: sessionTemplate.summary,

    weekNumber,
    totalWeekCount: programTemplate.totalWeekCount,

    phaseNumber: phase.phaseNumber,
    phaseDisplayName: phase.displayName,
    phaseSummary: phase.summary,
    targetEffortRange: phase.targetEffortRange,

    workingSetCount: week.workingSetCount,

    isDeloadWeek: week.isDeloadWeek,
    isCalibrationWeek: week.isCalibrationWeek,
    weekNote: week.weekNote,

    slots,
  };
}
