import type { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * Pressing.
 *
 * Note what is missing: there is no barbell bench press and no overhead press in
 * Phase 1 or 2. Overhead pressing needs scapular control that has to be built
 * first, which is what the face pulls and wall slides are quietly doing. The
 * landmine press is the first overhead-ish movement, and it only appears in
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
    exerciseId: 'landminePress',
    displayName: 'Half-Kneeling Landmine Press',
    shortDisplayName: 'Landmine Press',
    movementCategory: 'strength',
    movementPattern: 'verticalPush',
    primaryMuscleGroups: ['frontDeltoids', 'chest'],
    secondaryMuscleGroups: ['triceps', 'abdominals', 'obliques'],
    requiredEquipmentIds: ['barbell', 'landmineAttachment'],
    loadingStyle: 'barbell',
    formCues: [
      'Kneel on the same side as the pressing arm, other foot forward and flat.',
      'Hold the end of the bar at your shoulder, elbow tucked in front of you.',
      'Squeeze your glute on the kneeling side so your ribs stay down.',
      'Press up and forward along the angle of the bar, not straight up.',
      'Follow the bar with your eyes. It should finish above and in front of your head.',
    ],
    commonMistakes: [
      'Arching the lower back to get the bar higher. If the ribs flare, the set is over.',
      'Pressing straight up, which loses the whole reason the landmine is friendlier than a barbell.',
    ],
    whyItIsInTheProgramme:
      'This is your first overhead-ish press, and only if the shoulders have gone quiet. The bar’s angle means the shoulder never has to reach the position that hurts.',
    painAreasItHelps: ['shoulders'],
    painAreasToMonitor: ['shoulders', 'lowerBack'],
    substituteExerciseIds: ['inclineDumbbellPress', 'chestPressMachine'],
    mediaBrief: {
      startPosition:
        'Half-kneeling in profile with one knee down, holding the raised end of an angled barbell at the shoulder.',
      endPosition:
        'Bar end pressed up and forward until the arm is straight above and ahead of the head.',
      equipmentToDraw:
        'A barbell angled up from a floor pivot at the lower left, with a plate at the low end.',
    },
  },
];
