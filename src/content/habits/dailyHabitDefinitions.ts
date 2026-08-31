import type { DailyHabitDefinition } from '@/types/habitTypes';

/**
 * The daily checklist.
 *
 * Four things from docs/TRAINING_PROGRAM.md section 9 — protein, steps, no
 * liquid calories, sleep — plus the mobility routine from section 10, which is
 * tracked here because `dailyHabits` in docs/DATA_MODEL.md already has a field
 * for it and because a routine nobody ticks off is a routine nobody does.
 *
 * Nothing else is logged, weighed or counted. High compliance beats high
 * precision, and a food diary is the single most common reason a beginner quits.
 */
export const dailyHabitDefinitions: DailyHabitDefinition[] = [
  {
    habitId: 'didHitProteinTarget',
    displayName: 'Protein',
    answerKind: 'checkbox',
    staticTargetLabel: '150 g',
    unitLabel: null,
    whyItMatters:
      'Roughly 1.7 g per kilo of your target weight. This is the one that protects your muscle while you lose fat. If only one habit survives a bad week, make it this one.',
    orderIndex: 1,
  },
  {
    habitId: 'stepCount',
    displayName: 'Steps',
    answerKind: 'number',
    staticTargetLabel: null,
    unitLabel: 'steps',
    whyItMatters:
      'The target climbs from 5,000 to 9,000 across the twelve weeks. In the early weeks this will drive more fat loss than the gym does.',
    orderIndex: 2,
  },
  {
    habitId: 'didAvoidLiquidCalories',
    displayName: 'No liquid calories',
    answerKind: 'checkbox',
    staticTargetLabel: 'None',
    unitLabel: null,
    whyItMatters:
      'Soft drinks, juice, sugary coffee. The easiest few hundred calories anyone ever removes, and you will not miss them after a fortnight.',
    orderIndex: 3,
  },
  {
    habitId: 'sleepHours',
    displayName: 'Sleep',
    answerKind: 'number',
    staticTargetLabel: '7 hours',
    unitLabel: 'hours',
    whyItMatters:
      'Seven hours. Given the snoring and the low energy, this one is a health target rather than just a recovery one.',
    orderIndex: 4,
  },
  {
    habitId: 'didCompleteMobilityRoutine',
    displayName: 'Desk Undo',
    answerKind: 'checkbox',
    staticTargetLabel: '10 min',
    unitLabel: null,
    whyItMatters:
      'Ten minutes on the mat. This is the part that actually fixes the stiffness — the gym work supports it, it does not replace it.',
    orderIndex: 5,
  },
];

/**
 * The step target at the start and end of the programme. The weekly ramp between
 * them is calculated by `src/domain/habitTargets.ts`.
 */
export const stepCountTargets = {
  startingDailyStepTarget: 5000,
  finalDailyStepTarget: 9000,
} as const;

/** The daily protein target in grams. Roughly 1.7 g per kilo of target bodyweight. */
export const dailyProteinTargetGrams = 150;

/** The nightly sleep target in hours. */
export const nightlySleepTargetHours = 7;
