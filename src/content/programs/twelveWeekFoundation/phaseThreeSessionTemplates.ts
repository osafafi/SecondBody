import type { SessionTemplate } from '@/types/programTypes';

/**
 * Phase 3, weeks 9-12: "Train properly".
 *
 * Four changes, each of them a movement being allowed to grow up:
 *
 * 1. The goblet squat loses the box. You have been touching it accurately for
 *    eight weeks, so you no longer need it to tell you where the bottom is.
 * 2. The Romanian deadlift moves to a barbell. Out of the rack, never off the
 *    floor.
 * 3. The split squat gets dumbbells, which is the "+2 reps, then add load" rule
 *    from docs/TRAINING_PROGRAM.md section 7 finally reaching the "add load" half.
 * 4. The rowing machine replaces the bike as Session B's finisher. It waited
 *    until now because it repeatedly loads a rounded lower back under fatigue,
 *    and Session B is the day the hinge is trained, so the pattern is fresh.
 *
 * Four exercise ids change, which means four exercises with no history. That is
 * intentional and it is handled: an exercise with no history is prescribed as a
 * calibration, so the app asks you to find the weight rather than inventing one.
 * The starting weights below are the conservative floor for that conversation.
 */
export const phaseThreeSessionTemplates: SessionTemplate[] = [
  {
    sessionLetter: 'A',
    displayName: 'Legs & Pull',
    summary: 'Same shape, more weight, and a squat that no longer needs training wheels.',
    exerciseSlots: [
      {
        orderIndex: 1,
        exerciseId: 'legPress',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 40,
        },
        restSecondsBetweenSets: 90,
        slotNote: null,
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
        exerciseId: 'gobletSquat',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: false,
          startingWeightKilograms: 12,
        },
        restSecondsBetweenSets: 75,
        slotNote:
          'No box this time. Start where you finished with the box version, and go at least as deep as you were touching.',
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
    summary: 'The barbell arrives for the hinge, and the rower finally gets let in.',
    exerciseSlots: [
      {
        orderIndex: 1,
        exerciseId: 'inclineDumbbellPress',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: false,
          startingWeightKilograms: 8,
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
        exerciseId: 'barbellRomanianDeadlift',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: false,
          startingWeightKilograms: 20,
        },
        restSecondsBetweenSets: 90,
        slotNote:
          'Twenty kilos is the empty bar, and that is where this starts regardless of what the dumbbells were doing. A bar moves differently. Take it out of the rack.',
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
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 5,
        exerciseId: 'landminePress',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 6, maximumReps: 8 },
          isPerSide: true,
          startingWeightKilograms: 20,
        },
        restSecondsBetweenSets: 75,
        slotNote: 'The weight is the whole bar. Still only here while the shoulders stay quiet.',
        requiresPainFreeAreas: ['shoulders'],
      },
      {
        orderIndex: 6,
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
        orderIndex: 7,
        exerciseId: 'rowingMachineEasy',
        prescription: {
          kind: 'steadyStateCardio',
          durationMinutes: 10,
          machineSettingsNote: 'Easy pace, damper 3-4',
        },
        restSecondsBetweenSets: 0,
        slotNote:
          'Legs, then body, then arms. The moment your back rounds, the set is over — that is the whole reason this waited nine weeks.',
        requiresPainFreeAreas: [],
      },
    ],
  },

  {
    sessionLetter: 'C',
    displayName: 'Glutes & Carry',
    summary: 'The split squat gets weight in your hands, which it has earned.',
    exerciseSlots: [
      {
        orderIndex: 1,
        exerciseId: 'hipThrust',
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
        exerciseId: 'chestSupportedRow',
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
        orderIndex: 3,
        exerciseId: 'dumbbellSplitSquat',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 6, maximumReps: 8 },
          isPerSide: true,
          startingWeightKilograms: 8,
        },
        restSecondsBetweenSets: 75,
        slotNote:
          'Light to start. Balance first, load second — that has been true all the way through.',
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 4,
        exerciseId: 'chestPressMachine',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 10, maximumReps: 12 },
          isPerSide: false,
          startingWeightKilograms: 20,
        },
        restSecondsBetweenSets: 75,
        slotNote: null,
        requiresPainFreeAreas: [],
      },
      {
        orderIndex: 5,
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
];
