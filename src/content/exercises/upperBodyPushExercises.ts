import type { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * Pressing.
 *
 * Note what is missing: there is no barbell bench press and no overhead press in
 * Phase 1. Overhead pressing needs scapular control that has to be built first,
 * which is what the face pulls and wall slides are quietly doing. The machine
 * shoulder press is the first overhead movement, and it only appears from
 * Phase 2 if the shoulders have gone quiet. See docs/TRAINING_PROGRAM.md
 * sections 2 and 8.
 */
export const upperBodyPushExercises: ExerciseDefinition[] = [
  {
    exerciseId: 'chestPressMachine',
    displayName: 'Chest Press Machine',
    shortDisplayName: 'Chest Press',
    movementCategory: 'strength',
    movementPattern: 'horizontalPush',
    primaryMuscleGroups: ['chest'],
    secondaryMuscleGroups: ['frontDeltoids', 'triceps'],
    requiredEquipmentIds: ['chestPressMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Set the seat so the handles sit level with the middle of your chest, not your collarbones.',
      'Pull your shoulder blades back and down into the pad and keep them there.',
      'Press forward until the arms are nearly straight, without locking out hard.',
      'Come back until your hands are level with your chest, then press again.',
    ],
    commonMistakes: [
      'Seat set too low, which sends the press upwards and straight into the sore part of the shoulder.',
      'Letting the shoulders roll forward at the end of the press.',
      'Going so deep that the front of the shoulder takes the stretch.',
    ],
    whyItIsInTheProgramme:
      'A converging or neutral-grip press keeps your shoulders in a much friendlier position than a barbell bench, and the machine holds the path for you.',
    painAreasItHelps: [],
    painAreasToMonitor: ['shoulders'],
    substituteExerciseIds: ['inclineDumbbellPress'],
    mediaBrief: {
      startPosition:
        'Seated in a chest press machine with the back against the pad and both hands on the handles at chest height, elbows bent.',
      endPosition:
        'Arms pressed forward to nearly straight, shoulder blades still set back on the pad.',
      equipmentToDraw:
        'A seated chest press machine: seat back, and two horizontal handles on a pressing arm.',
    },
  },

  {
    exerciseId: 'inclineDumbbellPress',
    displayName: 'Incline Dumbbell Press',
    shortDisplayName: 'Incline DB Press',
    movementCategory: 'strength',
    movementPattern: 'horizontalPush',
    primaryMuscleGroups: ['chest', 'frontDeltoids'],
    secondaryMuscleGroups: ['triceps'],
    requiredEquipmentIds: ['dumbbells', 'adjustableBench'],
    loadingStyle: 'dumbbellPair',
    formCues: [
      'Set the bench to about 30 degrees. Steeper than that and it becomes a shoulder press.',
      'Sit down with the dumbbells on your thighs and kick them up as you lie back.',
      'Start with the dumbbells at the outside of your chest, palms facing forward and slightly in.',
      'Press up and slightly together, stopping just short of the elbows locking.',
      'Lower slowly until you feel a stretch across the chest, and no further.',
    ],
    commonMistakes: [
      'Setting the bench too upright, which loads the shoulder instead of the chest.',
      'Dropping the elbows too far below the bench and stretching the front of the shoulder.',
      'Clanging the dumbbells together at the top.',
    ],
    whyItIsInTheProgramme:
      'A free weight press where each arm has to hold its own path, which builds the shoulder stability a machine does for you.',
    painAreasItHelps: [],
    painAreasToMonitor: ['shoulders'],
    substituteExerciseIds: ['chestPressMachine'],
    mediaBrief: {
      startPosition:
        'Lying back on a bench set to about 30 degrees, a dumbbell in each hand at the outside of the chest with bent elbows.',
      endPosition: 'Both dumbbells pressed up above the chest with the arms nearly straight.',
      equipmentToDraw: 'An adjustable bench inclined to roughly 30 degrees, and two dumbbells.',
    },
  },

  {
    exerciseId: 'shoulderPressMachine',
    displayName: 'Shoulder Press Machine',
    shortDisplayName: 'Shoulder Press',
    movementCategory: 'strength',
    movementPattern: 'verticalPush',
    primaryMuscleGroups: ['frontDeltoids', 'sideDeltoids'],
    secondaryMuscleGroups: ['triceps', 'upperTraps'],
    requiredEquipmentIds: ['shoulderPressMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Set the seat so the handles start level with your shoulders, not above them.',
      'Sit right back and keep your ribs down. Do not let your back arch off the pad.',
      'Take a neutral grip if the machine offers one. Your shoulders prefer it.',
      'Press up smoothly and stop just short of locking the elbows.',
      'Lower under control until your hands are back at shoulder height, and no lower.',
    ],
    commonMistakes: [
      'Starting with the handles too low, which drags the shoulder through the range that hurts.',
      'Arching the lower back to finish the press. If the ribs flare, the weight is too heavy.',
      'Shrugging the shoulders up into your ears at the top.',
    ],
    whyItIsInTheProgramme:
      'This is your first real overhead press, and it only appears once the shoulders have gone quiet. The machine holds the path for you, which is exactly what an overhead press needs while the scapular control the face pulls and wall slides have been building is still new.',
    painAreasItHelps: [],
    painAreasToMonitor: ['shoulders', 'neck', 'lowerBack'],
    substituteExerciseIds: ['inclineDumbbellPress', 'chestPressMachine'],
    mediaBrief: {
      startPosition:
        'Seated upright in a shoulder press machine with the back against the pad and both hands on the handles at shoulder height, elbows bent and below the hands.',
      endPosition:
        'Arms pressed overhead to nearly straight, torso still upright and flat against the pad.',
      equipmentToDraw:
        'A seated shoulder press machine: seat, backrest and two vertical handles on a pressing arm above the shoulders.',
    },
  },
];
