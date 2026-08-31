import type { ExercisePerformanceHistory } from '@/types/performanceTypes';
import type {
  EffortTargetRange,
  LoadingStyle,
  PainArea,
  RepRange,
  SessionLetter,
} from '@/types/trainingVocabulary';
import type { ExerciseSlot, ProgramTemplate } from '@/types/programTypes';

import {
  calculateNextPrescribedCarryWeight,
  calculateNextPrescribedRepRange,
  calculateNextPrescribedWeight,
  type LoadDecisionReason,
  type RepRangeDecisionReason,
} from './exercisePrescription';
import { roundWeightDownToLoadableValue } from './loadIncrements';
import { findPhaseForWeekNumber, findProgramWeek, findSessionTemplate } from './programPhases';
import { resolveWarmupPlan, type PlannedWarmup } from './warmupPlanning';

/**
 * Turning "week 6, session B, at half past seven in the morning" into the exact
 * list of things to do and the exact weight for each of them.
 *
 * This is the function the active session screen will be built on. It composes
 * everything else in `src/domain/`: the phase lookup decides how many sets, the
 * progression rules decide the weight, the week's multiplier applies the deload,
 * and the warm-up planner picks the morning or the standard doses.
 *
 * It reads no clock, no content and no database. The caller passes in the
 * programme template, the history, and a way to look up an exercise's loading
 * style — everything else is arithmetic.
 */

export type PlannedPrescription =
  | {
      kind: 'weightAndReps';
      repRange: RepRange;
      isPerSide: boolean;
      prescribedWeightKilograms: number;
      loadDecisionReason: LoadDecisionReason;
      changeFromPreviousKilograms: number;
      wasEveryPreviousSetEasy: boolean;
    }
  | {
      kind: 'bodyweightReps';
      repRange: RepRange;
      isPerSide: boolean;
      repRangeDecisionReason: RepRangeDecisionReason;
    }
  | {
      kind: 'loadedCarry';
      distanceMetresPerSet: number;
      prescribedWeightKilograms: number;
      loadDecisionReason: LoadDecisionReason;
      changeFromPreviousKilograms: number;
      wasEveryPreviousSetEasy: boolean;
    }
  | {
      kind: 'steadyStateCardio';
      durationMinutes: number;
      machineSettingsNote: string;
    };

export type PlannedExercise = {
  orderIndex: number;
  exerciseId: string;
  slotNote: string | null;
  restSecondsBetweenSets: number;

  /** Cardio finishers are a single continuous effort, so this is 1 for them. */
  workingSetCount: number;

  prescription: PlannedPrescription;

  /** True when a set of this exercise caused sharp pain last time it was trained. */
  isFlaggedForPain: boolean;
};

/** The single light set of the first exercise, done straight after the warm-up drills. */
export type PlannedRampSet = {
  exerciseId: string;
  reps: number;
  weightKilograms: number;
};

export type PlannedSession = {
  sessionLetter: SessionLetter;
  displayName: string;
  summary: string;

  phaseNumber: number;
  phaseDisplayName: string;
  weekNumber: number;

  workingSetCount: number;
  isDeloadWeek: boolean;
  isCalibrationWeek: boolean;
  weekNote: string | null;
  targetEffortRange: EffortTargetRange;

  warmup: PlannedWarmup;
  rampSet: PlannedRampSet | null;

  exercises: PlannedExercise[];
};

export type SessionPlanRequest = {
  programTemplate: ProgramTemplate;
  weekNumber: number;
  sessionLetter: SessionLetter;

  /** 24-hour clock. Decides whether the warm-up is the morning version. */
  sessionStartHourOfDay: number;

  /** Keyed by exercise id. A missing entry means the exercise has never been trained. */
  performanceHistoryByExerciseId: Readonly<Record<string, ExercisePerformanceHistory>>;

  /**
   * Pain areas currently on the profile. Slots that require one of these to be
   * clear — the machine shoulder press, and its shoulders — are left out of the
   * plan.
   */
  activePainAreas: PainArea[];

  /**
   * Exercises the profile rules out outright, such as something a physio said
   * not to do. A hard blacklist: it beats the programme, the phase and the
   * pain conditions, and the slot simply does not appear.
   */
  excludedExerciseIds: string[];

  /**
   * How an exercise is loaded, resolved from `src/content/exercises/` by the
   * caller. Passed in rather than imported, because `src/domain/` depends on
   * nothing.
   */
  resolveLoadingStyleForExercise: (exerciseId: string) => LoadingStyle | null;

  /**
   * From `determineLayoffAdjustment`. 1 in the normal case, 0.8 on the way back
   * from ten days or more away.
   */
  layoffLoadMultiplier: number;
};

function isSlotAvailable(
  slot: ExerciseSlot,
  activePainAreas: PainArea[],
  excludedExerciseIds: string[],
): boolean {
  if (excludedExerciseIds.includes(slot.exerciseId)) {
    return false;
  }

  return !slot.requiresPainFreeAreas.some((requiredClearArea) =>
    activePainAreas.includes(requiredClearArea),
  );
}

function planExercise(
  slot: ExerciseSlot,
  request: SessionPlanRequest,
  combinedLoadMultiplier: number,
  weekWorkingSetCount: number,
): PlannedExercise {
  const history = request.performanceHistoryByExerciseId[slot.exerciseId] ?? null;
  const loadingStyle = request.resolveLoadingStyleForExercise(slot.exerciseId) ?? 'unloaded';

  const applyMultiplierAndRound = (weightKilograms: number): number =>
    roundWeightDownToLoadableValue(weightKilograms * combinedLoadMultiplier, loadingStyle);

  const baseExercise = {
    orderIndex: slot.orderIndex,
    exerciseId: slot.exerciseId,
    slotNote: slot.slotNote,
    restSecondsBetweenSets: slot.restSecondsBetweenSets,
  };

  switch (slot.prescription.kind) {
    case 'weightAndReps': {
      const { repRange, isPerSide, startingWeightKilograms } = slot.prescription;

      if (history === null) {
        return {
          ...baseExercise,
          workingSetCount: weekWorkingSetCount,
          isFlaggedForPain: false,
          prescription: {
            kind: 'weightAndReps',
            repRange,
            isPerSide,
            prescribedWeightKilograms: applyMultiplierAndRound(startingWeightKilograms),
            loadDecisionReason: 'firstTimeCalibration',
            changeFromPreviousKilograms: 0,
            wasEveryPreviousSetEasy: false,
          },
        };
      }

      const outcome = calculateNextPrescribedWeight({
        loadingStyle,
        repRange: history.lastPrescribedRepRange,
        lastPrescribedWeightKilograms:
          history.lastPrescribedWeightKilograms ?? startingWeightKilograms,
        lastPerformedSets: history.lastPerformedSets,
      });

      return {
        ...baseExercise,
        workingSetCount: weekWorkingSetCount,
        isFlaggedForPain: outcome.shouldFlagExerciseForPain,
        prescription: {
          kind: 'weightAndReps',
          repRange,
          isPerSide,
          prescribedWeightKilograms: applyMultiplierAndRound(outcome.prescribedWeightKilograms),
          loadDecisionReason: outcome.reason,
          changeFromPreviousKilograms: outcome.changeFromPreviousKilograms,
          wasEveryPreviousSetEasy: outcome.wasEveryWorkingSetEasy,
        },
      };
    }

    case 'bodyweightReps': {
      const { repRange, isPerSide } = slot.prescription;

      if (history === null) {
        return {
          ...baseExercise,
          workingSetCount: weekWorkingSetCount,
          isFlaggedForPain: false,
          prescription: {
            kind: 'bodyweightReps',
            repRange,
            isPerSide,
            repRangeDecisionReason: 'firstTimeCalibration',
          },
        };
      }

      const outcome = calculateNextPrescribedRepRange({
        baseRepRange: repRange,
        lastPrescribedRepRange: history.lastPrescribedRepRange,
        lastPerformedSets: history.lastPerformedSets,
      });

      return {
        ...baseExercise,
        workingSetCount: weekWorkingSetCount,
        isFlaggedForPain: outcome.shouldFlagExerciseForPain,
        prescription: {
          kind: 'bodyweightReps',
          repRange: outcome.repRange,
          isPerSide,
          repRangeDecisionReason: outcome.reason,
        },
      };
    }

    case 'loadedCarry': {
      const { distanceMetresPerSet, startingWeightKilograms } = slot.prescription;

      if (history === null) {
        return {
          ...baseExercise,
          workingSetCount: weekWorkingSetCount,
          isFlaggedForPain: false,
          prescription: {
            kind: 'loadedCarry',
            distanceMetresPerSet,
            prescribedWeightKilograms: applyMultiplierAndRound(startingWeightKilograms),
            loadDecisionReason: 'firstTimeCalibration',
            changeFromPreviousKilograms: 0,
            wasEveryPreviousSetEasy: false,
          },
        };
      }

      const outcome = calculateNextPrescribedCarryWeight({
        loadingStyle,
        lastPrescribedWeightKilograms:
          history.lastPrescribedWeightKilograms ?? startingWeightKilograms,
        lastPerformedSets: history.lastPerformedSets,
      });

      return {
        ...baseExercise,
        workingSetCount: weekWorkingSetCount,
        isFlaggedForPain: outcome.shouldFlagExerciseForPain,
        prescription: {
          kind: 'loadedCarry',
          distanceMetresPerSet,
          prescribedWeightKilograms: applyMultiplierAndRound(outcome.prescribedWeightKilograms),
          loadDecisionReason: outcome.reason,
          changeFromPreviousKilograms: outcome.changeFromPreviousKilograms,
          wasEveryPreviousSetEasy: outcome.wasEveryWorkingSetEasy,
        },
      };
    }

    case 'steadyStateCardio': {
      const { durationMinutes, machineSettingsNote } = slot.prescription;

      return {
        ...baseExercise,
        // A ten minute walk is one continuous effort, not three sets of it.
        workingSetCount: 1,
        isFlaggedForPain: false,
        prescription: {
          kind: 'steadyStateCardio',
          durationMinutes,
          machineSettingsNote,
        },
      };
    }
  }
}

function planRampSet(
  firstExercise: PlannedExercise | undefined,
  rampSetRepCount: number,
  rampSetLoadMultiplier: number,
  loadingStyle: LoadingStyle,
): PlannedRampSet | null {
  if (!firstExercise || firstExercise.prescription.kind !== 'weightAndReps') {
    return null;
  }

  const rampWeightKilograms = roundWeightDownToLoadableValue(
    firstExercise.prescription.prescribedWeightKilograms * rampSetLoadMultiplier,
    loadingStyle,
  );

  return {
    exerciseId: firstExercise.exerciseId,
    reps: rampSetRepCount,
    weightKilograms: rampWeightKilograms,
  };
}

/**
 * The full plan for one session.
 *
 * Returns null when the request does not describe a real session — a week
 * outside the programme, or a session letter the phase does not define. Callers
 * should treat that as a bug in whatever produced the request rather than as
 * something to show the user.
 */
export function resolveSessionPlan(request: SessionPlanRequest): PlannedSession | null {
  const { programTemplate, weekNumber, sessionLetter } = request;

  const phase = findPhaseForWeekNumber(programTemplate, weekNumber);
  const week = findProgramWeek(programTemplate, weekNumber);

  if (!phase || !week) {
    return null;
  }

  const sessionTemplate = findSessionTemplate(phase, sessionLetter);

  if (!sessionTemplate) {
    return null;
  }

  const combinedLoadMultiplier = week.loadMultiplier * request.layoffLoadMultiplier;

  const exercises = sessionTemplate.exerciseSlots
    .filter((slot) => isSlotAvailable(slot, request.activePainAreas, request.excludedExerciseIds))
    .slice()
    .sort((firstSlot, secondSlot) => firstSlot.orderIndex - secondSlot.orderIndex)
    .map((slot) => planExercise(slot, request, combinedLoadMultiplier, week.workingSetCount));

  const firstExercise = exercises[0];
  const rampSetLoadingStyle = firstExercise
    ? (request.resolveLoadingStyleForExercise(firstExercise.exerciseId) ?? 'unloaded')
    : 'unloaded';

  return {
    sessionLetter,
    displayName: sessionTemplate.displayName,
    summary: sessionTemplate.summary,

    phaseNumber: phase.phaseNumber,
    phaseDisplayName: phase.displayName,
    weekNumber,

    workingSetCount: week.workingSetCount,
    isDeloadWeek: week.isDeloadWeek,
    isCalibrationWeek: week.isCalibrationWeek,
    weekNote: week.weekNote,
    targetEffortRange: phase.targetEffortRange,

    warmup: resolveWarmupPlan(programTemplate.warmupRoutine, request.sessionStartHourOfDay),
    rampSet: planRampSet(
      firstExercise,
      programTemplate.warmupRoutine.rampSetRepCount,
      programTemplate.warmupRoutine.rampSetLoadMultiplier,
      rampSetLoadingStyle,
    ),

    exercises,
  };
}
