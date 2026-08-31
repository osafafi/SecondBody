import type { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * The ten-minute finisher at the end of every session, and the three minutes of
 * bike that start the warm-up.
 *
 * All of it is deliberately easy. The finisher is there to add a little work
 * without adding fatigue that costs you the next session — the daily step target
 * will drive far more fat loss than this does. See docs/TRAINING_PROGRAM.md
 * sections 3 and 9.
 */
export const cardioExercises: ExerciseDefinition[] = [
  {
    exerciseId: 'inclineTreadmillWalk',
    displayName: 'Incline Treadmill Walk',
    shortDisplayName: 'Incline Walk',
    movementCategory: 'cardio',
    movementPattern: 'steadyStateCardio',
    primaryMuscleGroups: ['glutes', 'calves'],
    secondaryMuscleGroups: ['hamstrings', 'quadriceps'],
    requiredEquipmentIds: ['treadmill'],
    loadingStyle: 'unloaded',
    formCues: [
      'Set the incline first, then the speed.',
      'Walk without holding the handrails. If you need them, the incline is too high.',
      'Stand tall and let your arms swing normally.',
      'You should be able to hold a conversation the whole time.',
    ],
    commonMistakes: [
      'Hanging off the handrails, which removes most of the work and wrecks your posture at the same time.',
      'Going fast enough that you are jogging. This is a walk.',
    ],
    whyItIsInTheProgramme:
      'Uphill walking works your glutes and calves properly with no impact on your knees, and it leaves you able to train again on Wednesday.',
    painAreasItHelps: ['hips', 'ankles'],
    painAreasToMonitor: ['knees', 'ankles'],
    substituteExerciseIds: ['stationaryBikeEasy'],
    mediaBrief: {
      startPosition:
        'Walking in profile on an inclined treadmill belt, rear foot pushing off, arms swinging freely away from the handrails.',
      endPosition:
        'The opposite stride: the other foot forward and flat on the belt, torso still upright.',
      equipmentToDraw:
        'A treadmill drawn in profile with a visibly inclined belt, a console and side handrails.',
    },
  },

  {
    exerciseId: 'stationaryBikeEasy',
    displayName: 'Stationary Bike, Easy',
    shortDisplayName: 'Bike',
    movementCategory: 'cardio',
    movementPattern: 'steadyStateCardio',
    primaryMuscleGroups: ['quadriceps'],
    secondaryMuscleGroups: ['glutes', 'hamstrings', 'calves'],
    requiredEquipmentIds: ['stationaryBike'],
    loadingStyle: 'unloaded',
    formCues: [
      'Set the saddle so your knee stays slightly bent at the bottom of the pedal stroke.',
      'Keep the resistance low and the legs turning easily.',
      'Sit up. Do not hunch over the bars — that is the posture we are trying to undo.',
      'Conversational pace throughout.',
    ],
    commonMistakes: [
      'A saddle set too low, which grinds the knees.',
      'Cranking the resistance up to make it feel like it counts. It is not meant to be hard.',
    ],
    whyItIsInTheProgramme:
      'At the start of a session it raises your tissue temperature, and nothing more. At the end it adds easy work with zero impact on the joints.',
    painAreasItHelps: ['knees'],
    painAreasToMonitor: ['knees'],
    substituteExerciseIds: ['inclineTreadmillWalk'],
    mediaBrief: {
      startPosition:
        'Seated upright on an upright stationary bike in profile, near leg at the top of the pedal stroke.',
      endPosition:
        'Half a revolution later, with the near leg extended at the bottom of the stroke.',
      equipmentToDraw:
        'An upright stationary bike in profile: frame, saddle, handlebars, crank and one pedal.',
    },
  },

  {
    exerciseId: 'rowingMachineEasy',
    displayName: 'Rowing Machine, Easy',
    shortDisplayName: 'Rower',
    movementCategory: 'cardio',
    movementPattern: 'steadyStateCardio',
    primaryMuscleGroups: ['midBack', 'quadriceps', 'glutes'],
    secondaryMuscleGroups: ['latissimusDorsi', 'hamstrings', 'biceps', 'forearmsAndGrip'],
    requiredEquipmentIds: ['rowingMachine'],
    loadingStyle: 'unloaded',
    formCues: [
      'Legs first, then body, then arms. Reverse that order on the way back.',
      'Push with the legs before the arms do anything at all.',
      'Finish with the handle at the bottom of your ribs and your shoulders back.',
      'Keep your back flat the whole way. The moment it rounds, stop the set.',
      'Easy pace. If your form is slipping, you are going too hard.',
    ],
    commonMistakes: [
      'Pulling with the arms first and dragging the legs along afterwards.',
      'Rounding the lower back to reach further forward at the catch.',
      'Rushing back up the slide, which is how the back ends up rounded under fatigue.',
    ],
    whyItIsInTheProgramme:
      'It waited until Phase 3 for a reason: it repeatedly loads a rounded lower back when you get tired. Now that your hinge is reliable, it is one of the best conditioning tools in the building.',
    painAreasItHelps: ['neck', 'shoulders'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['stationaryBikeEasy', 'inclineTreadmillWalk'],
    mediaBrief: {
      startPosition:
        'Seated at a rowing machine at the catch: knees bent, shins vertical, torso leaning slightly forward with arms extended to the handle.',
      endPosition:
        'At the finish: legs straight, torso leaning slightly back, handle drawn in to the bottom of the ribs.',
      equipmentToDraw:
        'A rowing machine in profile: a slide rail, a seat, a footplate, a chain and a handle.',
    },
  },
];
