import type { SessionTemplate } from '@/types/programTypes';

/**
 * Phase 1, weeks 1-4: "Groove the patterns".
 *
 * These are the three tables in docs/TRAINING_PROGRAM.md sections 4, 5 and 6,
 * with one interpretation applied throughout: **the rep count in those tables is
 * the TOP of the rep range, not a fixed target.** Double progression needs a
 * range to climb — "2 x 12" becomes two sets of 10 to 12, and the weight only
 * goes up once both sets reach 12. Without a range there is nothing to progress
 * through.
 *
 * The starting weights are the conservative ones from the same tables. They are
 * a starting line, not a test: week 1 exists to find out what they should
 * actually be.
 */
export const phaseOneSessionTemplates: SessionTemplate[] = [
  {
    sessionLetter: 'A',
    displayName: 'Legs & Pull',
    summary: 'The squat you are here to learn, and the row that undoes your desk.',
    exerciseSlots: [
      {
        orderIndex: 1,
        exerciseId: 'gobletSquatToBox',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: false,
          startingWeightKilograms: 10,
        },
        restSecondsBetweenSets: 90,
        slotNote:
          'First because it is the biggest thing you will do today, and you are freshest now. Learning the pattern matters more than the load for a few weeks yet.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 2,
        exerciseId: 'seatedCableRow',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 25,
        },
        restSecondsBetweenSets: 90,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 3,
        exerciseId: 'seatedLegCurl',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 15,
        },
        restSecondsBetweenSets: 75,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 4,
        exerciseId: 'legExtension',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 30,
        },
        restSecondsBetweenSets: 75,
        slotNote:
          'Seated, back supported, quads on their own. This is the machine that lets you load the legs properly on a day the squat felt awkward.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 5,
        exerciseId: 'pallofPress',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: true,
          startingWeightKilograms: 10,
        },
        restSecondsBetweenSets: 60,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 6,
        exerciseId: 'inclineTreadmillWalk',
        prescription: {
          kind: 'steadyStateCardio',
          durationMinutes: 10,
          machineSettingsNote: '5% incline, 5 km/h',
        },
        restSecondsBetweenSets: 0,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
    ],
  },

  {
    sessionLetter: 'B',
    displayName: 'Push & Hinge',
    summary: 'Pressing in shoulder-friendly positions, and the day the hinge gets taught.',
    exerciseSlots: [
      {
        orderIndex: 1,
        exerciseId: 'chestPressMachine',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 20,
        },
        restSecondsBetweenSets: 90,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 2,
        exerciseId: 'latPulldown',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 25,
        },
        restSecondsBetweenSets: 90,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 3,
        exerciseId: 'dumbbellRomanianDeadlift',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: false,
          startingWeightKilograms: 8,
        },
        restSecondsBetweenSets: 90,
        slotNote:
          'Light and slow, every week, until it is automatic. Everything heavier later depends on this one.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 4,
        exerciseId: 'cableFacePull',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 12, maximumReps: 15 },
          isPerSide: false,
          startingWeightKilograms: 10,
        },
        restSecondsBetweenSets: 60,
        slotNote:
          'Never skip this one. It is small, it is easy, and it is doing most of the work on your neck.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 5,
        exerciseId: 'deadBug',
        prescription: {
          kind: 'bodyweightReps',
          repRange: { minimumReps: 6, maximumReps: 8 },
          isPerSide: true,
        },
        restSecondsBetweenSets: 60,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 6,
        exerciseId: 'stationaryBikeEasy',
        prescription: {
          kind: 'steadyStateCardio',
          durationMinutes: 10,
          machineSettingsNote: 'Conversational pace',
        },
        restSecondsBetweenSets: 0,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
    ],
  },

  {
    sessionLetter: 'C',
    displayName: 'Glutes & Carry',
    summary:
      'The glutes that take the load off your back, and a walk that quietly does everything.',
    exerciseSlots: [
      {
        orderIndex: 1,
        exerciseId: 'dumbbellHipThrust',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 12,
        },
        restSecondsBetweenSets: 90,
        slotNote:
          'Bench against a wall, one dumbbell across the hips. The weight looks small written down and will not feel small by the second set.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 2,
        exerciseId: 'chestSupportedDumbbellRow',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 8,
        },
        restSecondsBetweenSets: 90,
        slotNote:
          'A full row with zero load on your lower back. On a grumpy-back day, this is the one you can always do.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 3,
        exerciseId: 'splitSquat',
        prescription: {
          kind: 'bodyweightReps',
          repRange: { minimumReps: 6, maximumReps: 8 },
          isPerSide: true,
        },
        restSecondsBetweenSets: 75,
        slotNote: 'Bodyweight only for now. Hold something for balance if you need to.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 4,
        exerciseId: 'seatedHipAbduction',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 12, maximumReps: 15 },
          isPerSide: false,
          startingWeightKilograms: 25,
        },
        restSecondsBetweenSets: 60,
        slotNote:
          'Straight after the split squat, because it trains the exact muscle that stops your front knee falling inwards on it.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 5,
        exerciseId: 'inclineDumbbellPress',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: false,
          startingWeightKilograms: 8,
        },
        restSecondsBetweenSets: 75,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 6,
        exerciseId: 'farmersCarry',
        prescription: {
          kind: 'loadedCarry',
          distanceMetresPerSet: 30,
          startingWeightKilograms: 12,
        },
        restSecondsBetweenSets: 60,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 7,
        exerciseId: 'inclineTreadmillWalk',
        prescription: {
          kind: 'steadyStateCardio',
          durationMinutes: 10,
          machineSettingsNote: '5% incline, 5 km/h',
        },
        restSecondsBetweenSets: 0,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
    ],
  },
];
