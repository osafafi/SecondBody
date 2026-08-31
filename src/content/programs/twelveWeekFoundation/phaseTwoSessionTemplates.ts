import type { SessionTemplate } from '@/types/programTypes';

/**
 * Phase 2, weeks 5-8: "Add load".
 *
 * Three changes from Phase 1, and only three. Everything else is deliberately
 * identical, because eight weeks of the same movements is how a beginner gets
 * good at them — see docs/TRAINING_PROGRAM.md section 8.
 *
 * 1. **The presses swap places.** The incline dumbbell press moves to Session B
 *    slot 1, where it is done fresh, and the chest press machine takes its old
 *    place as Session C's secondary press. This is the "incline dumbbell press
 *    replaces some machine pressing" from the phase description: the free weight
 *    version becomes the main press, the machine stays for the tired slot.
 * 2. **The landmine press appears**, and only if the shoulders have gone quiet.
 *    `requiresPainFreeAreas` is what enforces that — if shoulder pain is on the
 *    profile, the slot never renders.
 * 3. **Session A does not change at all.** The goblet squat getting heavier is
 *    progression doing its job, not a different exercise.
 *
 * The starting weights below are unchanged from Phase 1 on purpose. They are
 * only ever used when an exercise has no history at all; by week 5 every load
 * comes from what was actually lifted in week 4.
 */
export const phaseTwoSessionTemplates: SessionTemplate[] = [
  {
    sessionLetter: 'A',
    displayName: 'Legs & Pull',
    summary: 'The same session as last month, and heavier than you would have believed in week 1.',
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
        exerciseId: 'gobletSquatToBox',
        prescription: {
          kind: 'weightAndReps',
          repRange: { minimumReps: 8, maximumReps: 10 },
          isPerSide: false,
          startingWeightKilograms: 10,
        },
        restSecondsBetweenSets: 75,
        slotNote: 'Still to the box. The box goes away in Phase 3, not before.',
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
    summary: 'The dumbbells take over the pressing, and the hinge starts carrying real weight.',
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
        slotNote:
          'Promoted to first. Free weights are more honest than a machine, so they go where you are freshest.',
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
        slotNote: 'The pattern is drilled now. This is where it is allowed to get heavy.',
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
        slotNote:
          'Your first overhead-ish press, and it only shows up because your shoulders have been quiet. The weight is the whole bar, so 20 kg means the empty bar. If a session is running long, this is the one to drop.',
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
    summary: 'Glutes, back, and a carry that is about to stop feeling easy.',
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
        exerciseId: 'splitSquat',
        prescription: {
          kind: 'bodyweightReps',
          repRange: { minimumReps: 6, maximumReps: 8 },
          isPerSide: true,
        },
        restSecondsBetweenSets: 75,
        slotNote: 'Still bodyweight, but the reps are climbing. Load arrives in Phase 3.',
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
        slotNote:
          'Demoted to the second press of the week, which is exactly what a machine is good for: work you can do properly when you are already tired.',
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
