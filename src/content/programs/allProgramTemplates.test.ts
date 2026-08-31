import { describe, expect, it } from 'vitest';

import { allProgramTemplates, findProgramTemplateById } from './allProgramTemplates';
import { twelveWeekFoundationProgram } from './twelveWeekFoundation/twelveWeekFoundationProgram';
import { findExerciseById } from '@/content/exercises/allExercises';
import { deskUndoRoutine } from '@/content/mobility/deskUndoRoutine';
import { SESSION_LETTERS } from '@/types/trainingVocabulary';
import type { ExerciseSlot } from '@/types/programTypes';

/**
 * Integrity tests for the programme content.
 *
 * The point of these is that the twelve week programme is a lot of numbers
 * typed by hand, and the failure modes — a slot pointing at an exercise that
 * does not exist, a rep range with its ends the wrong way round, a phase that
 * quietly skips week 7 — are all invisible until someone is standing in front of
 * a machine.
 *
 * They also pin the decisions docs/TRAINING_PROGRAM.md makes, so that changing
 * one in code without changing it in the document fails here.
 */

const everySlot: ExerciseSlot[] = twelveWeekFoundationProgram.phases.flatMap((phase) =>
  phase.sessionTemplates.flatMap((sessionTemplate) => sessionTemplate.exerciseSlots),
);

const everyWeek = twelveWeekFoundationProgram.phases.flatMap((phase) => phase.weeks);

describe('the programme registry', () => {
  it('ships the twelve week foundation programme', () => {
    expect(allProgramTemplates).toContain(twelveWeekFoundationProgram);
  });

  it('gives every programme a unique id', () => {
    const programTemplateIds = allProgramTemplates.map(
      (programTemplate) => programTemplate.programTemplateId,
    );

    expect(new Set(programTemplateIds).size).toBe(programTemplateIds.length);
  });

  it('finds a programme by id and returns null for an unknown one', () => {
    expect(findProgramTemplateById('twelveWeekFoundation')).toBe(twelveWeekFoundationProgram);
    expect(findProgramTemplateById('nonsense')).toBeNull();
  });
});

describe('the twelve weeks', () => {
  it('covers weeks 1 to 12 exactly once each, in order', () => {
    expect(everyWeek.map((week) => week.weekNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it('matches the stated total week count', () => {
    expect(everyWeek).toHaveLength(twelveWeekFoundationProgram.totalWeekCount);
  });

  it('runs three phases of four weeks each', () => {
    expect(twelveWeekFoundationProgram.phases.map((phase) => phase.phaseNumber)).toEqual([1, 2, 3]);

    for (const phase of twelveWeekFoundationProgram.phases) {
      expect(phase.weeks, `phase ${phase.phaseNumber}`).toHaveLength(4);
    }
  });

  it('makes week 1 the only calibration week', () => {
    const calibrationWeeks = everyWeek
      .filter((week) => week.isCalibrationWeek)
      .map((week) => week.weekNumber);

    expect(calibrationWeeks).toEqual([1]);
  });

  it('makes week 8 the only deload week, at two sets and eighty percent', () => {
    const deloadWeeks = everyWeek.filter((week) => week.isDeloadWeek);

    expect(deloadWeeks.map((week) => week.weekNumber)).toEqual([8]);
    expect(deloadWeeks[0]?.workingSetCount).toBe(2);
    expect(deloadWeeks[0]?.loadMultiplier).toBe(0.8);
  });

  it('leaves every other week at full load', () => {
    for (const week of everyWeek) {
      if (!week.isDeloadWeek) {
        expect(week.loadMultiplier, `week ${week.weekNumber}`).toBe(1);
      }
    }
  });

  it('builds from two working sets to three, and never asks for more', () => {
    expect(everyWeek.slice(0, 2).map((week) => week.workingSetCount)).toEqual([2, 2]);

    for (const week of everyWeek) {
      expect(week.workingSetCount, `week ${week.weekNumber}`).toBeGreaterThanOrEqual(2);
      expect(week.workingSetCount, `week ${week.weekNumber}`).toBeLessThanOrEqual(3);
    }
  });

  it('raises the effort target with every phase, and never past RPE 8', () => {
    const effortCeilings = twelveWeekFoundationProgram.phases.map(
      (phase) => phase.targetEffortRange.maximumRatingOfPerceivedExertion,
    );

    expect(effortCeilings).toEqual([6, 7, 8]);

    for (const phase of twelveWeekFoundationProgram.phases) {
      expect(
        phase.targetEffortRange.minimumRatingOfPerceivedExertion,
        `phase ${phase.phaseNumber}`,
      ).toBeLessThan(phase.targetEffortRange.maximumRatingOfPerceivedExertion);
    }
  });
});

describe('every session', () => {
  it('exists as A, B and C in all three phases', () => {
    for (const phase of twelveWeekFoundationProgram.phases) {
      expect(
        phase.sessionTemplates.map((sessionTemplate) => sessionTemplate.sessionLetter),
        `phase ${phase.phaseNumber}`,
      ).toEqual([...SESSION_LETTERS]);
    }
  });

  it('numbers its slots from 1 with no gaps', () => {
    for (const phase of twelveWeekFoundationProgram.phases) {
      for (const sessionTemplate of phase.sessionTemplates) {
        const orderIndexes = sessionTemplate.exerciseSlots.map((slot) => slot.orderIndex);
        const expectedIndexes = orderIndexes.map((_unused, index) => index + 1);

        expect(
          orderIndexes,
          `phase ${phase.phaseNumber} session ${sessionTemplate.sessionLetter}`,
        ).toEqual(expectedIndexes);
      }
    }
  });

  it('never prescribes the same exercise twice', () => {
    for (const phase of twelveWeekFoundationProgram.phases) {
      for (const sessionTemplate of phase.sessionTemplates) {
        const exerciseIds = sessionTemplate.exerciseSlots.map((slot) => slot.exerciseId);

        expect(
          new Set(exerciseIds).size,
          `phase ${phase.phaseNumber} session ${sessionTemplate.sessionLetter}`,
        ).toBe(exerciseIds.length);
      }
    }
  });

  it('finishes with the cardio, and has exactly one piece of it', () => {
    for (const phase of twelveWeekFoundationProgram.phases) {
      for (const sessionTemplate of phase.sessionTemplates) {
        const cardioSlots = sessionTemplate.exerciseSlots.filter(
          (slot) => slot.prescription.kind === 'steadyStateCardio',
        );
        const lastSlot = sessionTemplate.exerciseSlots.at(-1);

        expect(
          cardioSlots,
          `phase ${phase.phaseNumber} session ${sessionTemplate.sessionLetter}`,
        ).toHaveLength(1);
        expect(lastSlot?.prescription.kind).toBe('steadyStateCardio');
      }
    }
  });

  it('stays inside the 45-60 minute budget on slot count alone', () => {
    for (const phase of twelveWeekFoundationProgram.phases) {
      for (const sessionTemplate of phase.sessionTemplates) {
        expect(
          sessionTemplate.exerciseSlots.length,
          `phase ${phase.phaseNumber} session ${sessionTemplate.sessionLetter}`,
        ).toBeLessThanOrEqual(7);
      }
    }
  });

  it('covers every major pattern across the three sessions of a phase', () => {
    // "Every session is full body" is a claim about the week, not about one
    // session: each movement pattern gets hit two to three times weekly.
    for (const phase of twelveWeekFoundationProgram.phases) {
      const patternsInPhase = new Set(
        phase.sessionTemplates
          .flatMap((sessionTemplate) => sessionTemplate.exerciseSlots)
          .map((slot) => findExerciseById(slot.exerciseId)?.movementPattern),
      );

      for (const requiredPattern of [
        'squat',
        'hinge',
        'horizontalPush',
        'horizontalPull',
      ] as const) {
        expect(patternsInPhase, `phase ${phase.phaseNumber}`).toContain(requiredPattern);
      }
    }
  });
});

describe('every exercise slot', () => {
  it('points at an exercise that exists', () => {
    for (const slot of everySlot) {
      expect(findExerciseById(slot.exerciseId), `slot "${slot.exerciseId}"`).not.toBeNull();
    }
  });

  it('rests for a sensible length of time', () => {
    for (const slot of everySlot) {
      if (slot.prescription.kind === 'steadyStateCardio') {
        expect(slot.restSecondsBetweenSets, `slot "${slot.exerciseId}"`).toBe(0);
      } else {
        expect(slot.restSecondsBetweenSets, `slot "${slot.exerciseId}"`).toBeGreaterThanOrEqual(45);
        expect(slot.restSecondsBetweenSets, `slot "${slot.exerciseId}"`).toBeLessThanOrEqual(180);
      }
    }
  });

  it('states a rep range that climbs rather than a fixed number', () => {
    // The tables in docs/TRAINING_PROGRAM.md give one number per exercise. That
    // number is the TOP of the range here, because double progression needs
    // somewhere to climb from.
    for (const slot of everySlot) {
      if (
        slot.prescription.kind === 'weightAndReps' ||
        slot.prescription.kind === 'bodyweightReps'
      ) {
        const { minimumReps, maximumReps } = slot.prescription.repRange;

        expect(minimumReps, `slot "${slot.exerciseId}"`).toBeGreaterThan(0);
        expect(maximumReps, `slot "${slot.exerciseId}"`).toBeGreaterThan(minimumReps);
      }
    }
  });

  it('starts every loaded exercise somewhere real', () => {
    for (const slot of everySlot) {
      if (slot.prescription.kind === 'weightAndReps' || slot.prescription.kind === 'loadedCarry') {
        expect(
          slot.prescription.startingWeightKilograms,
          `slot "${slot.exerciseId}"`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('prescribes each exercise the way that exercise is actually loaded', () => {
    for (const slot of everySlot) {
      const exercise = findExerciseById(slot.exerciseId);

      expect(exercise, `slot "${slot.exerciseId}"`).not.toBeNull();

      if (!exercise) {
        continue;
      }

      switch (slot.prescription.kind) {
        case 'bodyweightReps':
          expect(exercise.loadingStyle, `slot "${slot.exerciseId}"`).toBe('bodyweight');
          break;
        case 'steadyStateCardio':
          expect(exercise.movementCategory, `slot "${slot.exerciseId}"`).toBe('cardio');
          break;
        case 'weightAndReps':
        case 'loadedCarry':
          expect(['bodyweight', 'unloaded'], `slot "${slot.exerciseId}"`).not.toContain(
            exercise.loadingStyle,
          );
          break;
      }
    }
  });

  it('only makes the landmine press conditional, and only on the shoulders', () => {
    const conditionalSlots = everySlot.filter((slot) => slot.requiresPainFreeAreas.length > 0);

    expect(new Set(conditionalSlots.map((slot) => slot.exerciseId))).toEqual(
      new Set(['landminePress']),
    );

    for (const slot of conditionalSlots) {
      expect(slot.requiresPainFreeAreas).toEqual(['shoulders']);
    }
  });

  it('never prescribes a movement Phase 1 deliberately excludes', () => {
    // docs/TRAINING_PROGRAM.md section 2: no overhead pressing, no loaded spinal
    // flexion, no barbell back squat, no rowing machine, no deadlifts from the
    // floor. The rower and the landmine press are Phase 2 and 3 only.
    const phaseOne = twelveWeekFoundationProgram.phases[0];
    const phaseOneExerciseIds = new Set(
      phaseOne?.sessionTemplates.flatMap((sessionTemplate) =>
        sessionTemplate.exerciseSlots.map((slot) => slot.exerciseId),
      ) ?? [],
    );

    expect(phaseOneExerciseIds.has('rowingMachineEasy')).toBe(false);
    expect(phaseOneExerciseIds.has('landminePress')).toBe(false);
    expect(phaseOneExerciseIds.has('barbellRomanianDeadlift')).toBe(false);
  });

  it('trains the midsection by resisting movement, never by flexing the spine', () => {
    // No sit-ups, no crunches, no machine twists, anywhere, ever. A plank-family
    // movement gives everything they would, and the lower back has had enough.
    const permittedCorePatterns = ['antiRotation', 'antiExtension', 'carry'];

    for (const slot of everySlot) {
      const exercise = findExerciseById(slot.exerciseId);

      if (exercise?.primaryMuscleGroups.includes('abdominals')) {
        expect(permittedCorePatterns, `slot "${slot.exerciseId}"`).toContain(
          exercise.movementPattern,
        );
      }
    }
  });
});

describe('the warm-up', () => {
  const { warmupRoutine } = twelveWeekFoundationProgram;

  it('points at exercises that exist', () => {
    for (const step of warmupRoutine.steps) {
      expect(findExerciseById(step.exerciseId), `warm-up step "${step.exerciseId}"`).not.toBeNull();
    }
  });

  it('numbers its steps from 1 with no gaps', () => {
    expect(warmupRoutine.steps.map((step) => step.orderIndex)).toEqual(
      warmupRoutine.steps.map((_unused, index) => index + 1),
    );
  });

  it('gives every step both a morning and a standard volume', () => {
    for (const step of warmupRoutine.steps) {
      for (const [label, volume] of [
        ['morning', step.morningVolume],
        ['standard', step.standardVolume],
      ] as const) {
        const hasSomeVolume = volume.reps !== null || volume.durationSeconds !== null;

        expect(hasSomeVolume, `${label} volume for "${step.exerciseId}"`).toBe(true);
      }
    }
  });

  it('never asks for more later in the day than first thing', () => {
    for (const step of warmupRoutine.steps) {
      expect(step.standardVolume.reps ?? 0, `step "${step.exerciseId}"`).toBeLessThanOrEqual(
        step.morningVolume.reps ?? 0,
      );
      expect(
        step.standardVolume.durationSeconds ?? 0,
        `step "${step.exerciseId}"`,
      ).toBeLessThanOrEqual(step.morningVolume.durationSeconds ?? 0);
    }
  });

  it('switches to the longer version before 10:00', () => {
    expect(warmupRoutine.morningCutoffHour).toBe(10);
  });

  it('ramps at a fraction of the working weight, not at it', () => {
    expect(warmupRoutine.rampSetLoadMultiplier).toBeGreaterThan(0);
    expect(warmupRoutine.rampSetLoadMultiplier).toBeLessThan(1);
    expect(warmupRoutine.rampSetRepCount).toBeGreaterThan(0);
  });
});

describe('the Desk Undo mobility routine', () => {
  it('points at exercises that exist', () => {
    for (const step of deskUndoRoutine.steps) {
      expect(
        findExerciseById(step.exerciseId),
        `mobility step "${step.exerciseId}"`,
      ).not.toBeNull();
    }
  });

  it('numbers its steps from 1 with no gaps', () => {
    expect(deskUndoRoutine.steps.map((step) => step.orderIndex)).toEqual(
      deskUndoRoutine.steps.map((_unused, index) => index + 1),
    );
  });

  it('gives every step a volume', () => {
    for (const step of deskUndoRoutine.steps) {
      const hasSomeVolume = step.volume.reps !== null || step.volume.durationSeconds !== null;

      expect(hasSomeVolume, `step "${step.exerciseId}"`).toBe(true);
    }
  });

  it('is only made of movements that need a mat, a band, a roller or a wall', () => {
    const homeEquipmentIds = new Set([
      'bodyweightOnly',
      'exerciseMat',
      'resistanceBand',
      'foamRoller',
      'wall',
    ]);

    for (const step of deskUndoRoutine.steps) {
      const exercise = findExerciseById(step.exerciseId);

      for (const equipmentId of exercise?.requiredEquipmentIds ?? []) {
        expect(homeEquipmentIds, `step "${step.exerciseId}"`).toContain(equipmentId);
      }
    }
  });

  it('claims a duration in the right neighbourhood of its actual length', () => {
    expect(deskUndoRoutine.estimatedDurationMinutes).toBeGreaterThanOrEqual(5);
    expect(deskUndoRoutine.estimatedDurationMinutes).toBeLessThanOrEqual(15);
  });
});

describe('the safety rails', () => {
  it('never allows two strength sessions less than 48 hours apart', () => {
    expect(twelveWeekFoundationProgram.minimumHoursBetweenSessions).toBe(48);
  });

  it('trains on Monday, Wednesday and Friday', () => {
    expect(twelveWeekFoundationProgram.defaultTrainingDaysOfWeek).toEqual([1, 3, 5]);
  });

  it('leaves at least a day between every pair of training days', () => {
    const trainingDays = twelveWeekFoundationProgram.defaultTrainingDaysOfWeek;

    for (const [index, dayOfWeek] of trainingDays.entries()) {
      const nextDayOfWeek = trainingDays[index + 1];

      if (nextDayOfWeek !== undefined) {
        expect(nextDayOfWeek - dayOfWeek).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
