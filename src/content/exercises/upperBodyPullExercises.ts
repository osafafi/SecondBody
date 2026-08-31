import type { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * Rows, pulldowns and face pulls.
 *
 * This is the highest-value group in the whole programme for the neck and
 * shoulder pain. Six years of reaching forward for a mouse switched these
 * muscles off; every session trains at least one of them, and Session B trains
 * two. See docs/TRAINING_PROGRAM.md sections 4 and 5.
 */
export const upperBodyPullExercises: ExerciseDefinition[] = [
  {
    exerciseId: 'seatedCableRow',
    displayName: 'Seated Cable Row, Neutral Grip',
    shortDisplayName: 'Cable Row',
    movementCategory: 'strength',
    movementPattern: 'horizontalPull',
    primaryMuscleGroups: ['midBack', 'latissimusDorsi'],
    secondaryMuscleGroups: ['rearDeltoids', 'biceps', 'forearmsAndGrip'],
    requiredEquipmentIds: ['seatedCableRowMachine'],
    loadingStyle: 'cableStack',
    formCues: [
      'Sit tall with a small bend in the knees and your chest up.',
      'Start each rep by pulling your shoulder blades back and down, before the arms do anything.',
      'Pull the handle to your belly button, elbows brushing past your ribs.',
      'Hold for a beat at the back, then let it out slowly.',
      'Keep your neck long. Do not lead with your chin.',
    ],
    commonMistakes: [
      'Rowing with the arms and leaving the shoulder blades where they are. The back is meant to move first.',
      'Rocking backwards and forwards from the hips to generate the pull.',
      'Shrugging the shoulders up towards the ears, which is exactly the habit we are undoing.',
    ],
    whyItIsInTheProgramme:
      'This is the single highest-value exercise here for your neck. It trains precisely what sitting at a desk switched off.',
    painAreasItHelps: ['neck', 'shoulders'],
    painAreasToMonitor: ['lowerBack', 'shoulders'],
    substituteExerciseIds: ['chestSupportedRow', 'latPulldown'],
    mediaBrief: {
      startPosition:
        'Seated at a low cable row with the feet braced on the platform, torso upright and arms extended forward holding a neutral-grip handle.',
      endPosition:
        'Handle drawn to the navel with the elbows back past the ribs and the shoulder blades pinched together.',
      equipmentToDraw:
        'A low cable pulley with a foot platform, a seat pad, a cable and a short neutral-grip handle.',
    },
  },

  {
    exerciseId: 'latPulldown',
    displayName: 'Lat Pulldown, Neutral Grip',
    shortDisplayName: 'Lat Pulldown',
    movementCategory: 'strength',
    movementPattern: 'verticalPull',
    primaryMuscleGroups: ['latissimusDorsi'],
    secondaryMuscleGroups: ['midBack', 'rearDeltoids', 'biceps', 'forearmsAndGrip'],
    requiredEquipmentIds: ['latPulldownMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Set the thigh pad tight enough that you cannot lift off the seat.',
      'Take a neutral grip, palms facing each other.',
      'Lean back very slightly and keep your chest lifted towards the bar.',
      'Pull your elbows down towards your back pockets, not the bar down to your chin.',
      'Let it rise all the way up and feel the stretch before the next rep.',
    ],
    commonMistakes: [
      'Leaning back further and further as it gets hard, which turns it into a row.',
      'Pulling behind the neck. Never do that one — it is hard on exactly the shoulders we are protecting.',
      'Stopping short at the top and losing the stretch, which is where most of the benefit is.',
    ],
    whyItIsInTheProgramme:
      'A neutral grip keeps your shoulders in a friendly position while you build the pulling strength that eventually makes chin-ups possible.',
    painAreasItHelps: ['neck', 'shoulders'],
    painAreasToMonitor: ['shoulders'],
    substituteExerciseIds: ['seatedCableRow', 'chestSupportedRow'],
    mediaBrief: {
      startPosition:
        'Seated at a lat pulldown with the thighs under a restraint pad, arms fully extended overhead holding a neutral-grip attachment.',
      endPosition:
        'Attachment pulled to the upper chest with the elbows driven down beside the ribs.',
      equipmentToDraw:
        'An overhead cable pulley with a neutral-grip attachment, a seat and a thigh restraint pad.',
    },
  },

  {
    exerciseId: 'chestSupportedRow',
    displayName: 'Chest-Supported Row',
    shortDisplayName: 'Supported Row',
    movementCategory: 'strength',
    movementPattern: 'horizontalPull',
    primaryMuscleGroups: ['midBack', 'latissimusDorsi'],
    secondaryMuscleGroups: ['rearDeltoids', 'biceps', 'forearmsAndGrip'],
    requiredEquipmentIds: ['chestSupportedRowMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Set the seat so the handles line up with the middle of your chest.',
      'Keep your chest pinned to the pad for every single rep.',
      'Pull the handles back, leading with the elbows, and pinch the shoulder blades at the end.',
      'Return slowly and let the shoulder blades travel forward before you pull again.',
    ],
    commonMistakes: [
      'Peeling the chest off the pad to move more weight. That is the one thing this machine exists to prevent.',
      'Shrugging at the end of the pull instead of squeezing the blades together.',
    ],
    whyItIsInTheProgramme:
      'All the mid-back benefit of a row with literally zero load on your lower back. On a day when the back is grumpy, this is the row you can always do.',
    painAreasItHelps: ['neck', 'shoulders', 'lowerBack'],
    painAreasToMonitor: ['shoulders'],
    substituteExerciseIds: ['seatedCableRow', 'latPulldown'],
    mediaBrief: {
      startPosition:
        'Seated at a chest-supported row machine, chest against an angled pad, arms extended forward holding two handles.',
      endPosition:
        'Handles drawn back past the ribs with the shoulder blades pinched, chest still on the pad.',
      equipmentToDraw:
        'A chest-supported row machine: an angled chest pad, a seat and two horizontal handles on pivoting arms.',
    },
  },

  {
    exerciseId: 'cableFacePull',
    displayName: 'Cable Face Pull',
    shortDisplayName: 'Face Pull',
    movementCategory: 'strength',
    movementPattern: 'horizontalPull',
    primaryMuscleGroups: ['rearDeltoids', 'midBack'],
    secondaryMuscleGroups: ['upperTraps', 'forearmsAndGrip'],
    requiredEquipmentIds: ['cableStation'],
    loadingStyle: 'cableStack',
    formCues: [
      'Set the pulley to about the height of your own face.',
      'Take the rope with your thumbs pointing back at you.',
      'Pull the rope towards your forehead and let your hands split apart as it arrives.',
      'Finish with your elbows high and wide, in a double bicep shape.',
      'Light weight. This one is never meant to be heavy.',
    ],
    commonMistakes: [
      'Going too heavy, which turns it into a bad row and defeats the purpose.',
      'Pulling to the chest instead of the face, which loses the external rotation that is the whole point.',
      'Letting the elbows drop below the hands.',
    ],
    whyItIsInTheProgramme:
      'The most important small exercise here. It directly opposes the desk posture behind your neck and shoulder pain, and it is almost impossible to do badly.',
    painAreasItHelps: ['neck', 'shoulders'],
    painAreasToMonitor: ['shoulders'],
    substituteExerciseIds: ['bandPullApart'],
    mediaBrief: {
      startPosition:
        'Standing facing a high cable pulley, arms extended forward at face height holding both ends of a rope attachment.',
      endPosition:
        'Rope pulled to the forehead with the hands split wide apart and the elbows high and level with the shoulders.',
      equipmentToDraw: 'A cable pulley set at head height with a two-tailed rope attachment.',
    },
  },
];
