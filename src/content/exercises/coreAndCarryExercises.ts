import type { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * Core work and loaded carries.
 *
 * Every movement here resists motion rather than creating it — anti-rotation,
 * anti-extension, anti-everything. There are no sit-ups, crunches or machine
 * twists anywhere in this programme: loaded spinal flexion has no upside that a
 * plank-family movement does not give more safely, and the lower back has had
 * enough. See docs/TRAINING_PROGRAM.md section 2.
 */
export const coreAndCarryExercises: ExerciseDefinition[] = [
  {
    exerciseId: 'pallofPress',
    displayName: 'Pallof Press',
    shortDisplayName: 'Pallof Press',
    movementCategory: 'strength',
    movementPattern: 'antiRotation',
    primaryMuscleGroups: ['obliques', 'abdominals'],
    secondaryMuscleGroups: ['glutes', 'frontDeltoids'],
    requiredEquipmentIds: ['cableStation'],
    loadingStyle: 'cableStack',
    formCues: [
      'Set the pulley to chest height and stand side-on to it, a stride away.',
      'Hold the handle at your chest with both hands, feet shoulder width.',
      'Press the handle straight out in front of you and do not let it pull you round.',
      'Hold it out there for two seconds, then bring it back to your chest.',
      'The cable wants to rotate you. Your job is to refuse.',
    ],
    commonMistakes: [
      'Standing too close to the stack, which leaves almost no resistance.',
      'Letting the shoulders turn towards the pulley as the arms extend.',
      'Holding your breath. Breathe normally throughout.',
    ],
    whyItIsInTheProgramme:
      'It trains your midsection to keep your spine still while your limbs move, which is what a core is actually for.',
    painAreasItHelps: ['lowerBack'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['deadBug'],
    mediaBrief: {
      startPosition:
        'Standing side-on to a chest-height cable pulley, both hands holding a handle in against the chest.',
      endPosition:
        'Arms pressed straight out in front of the chest, torso still square and not rotated.',
      equipmentToDraw:
        'A cable pulley at chest height to one side, with a single D-handle and a taut cable.',
    },
  },

  {
    exerciseId: 'deadBug',
    displayName: 'Dead Bug',
    shortDisplayName: 'Dead Bug',
    movementCategory: 'strength',
    movementPattern: 'antiExtension',
    primaryMuscleGroups: ['abdominals'],
    secondaryMuscleGroups: ['hipFlexors', 'obliques'],
    requiredEquipmentIds: ['exerciseMat'],
    loadingStyle: 'bodyweight',
    formCues: [
      'Lie on your back with your arms straight up and your knees over your hips, shins level.',
      'Flatten your lower back into the floor and keep it there for the whole set.',
      'Lower the opposite arm and leg slowly towards the floor.',
      'Stop the moment your back starts to arch, then come back and swap sides.',
      'Slow. This is not a race and speed removes all of the benefit.',
    ],
    commonMistakes: [
      'Letting the lower back lift off the floor, which is the exact thing this movement exists to prevent.',
      'Going too fast, which lets momentum do the work.',
      'Holding your breath instead of breathing out as the limbs extend.',
    ],
    whyItIsInTheProgramme:
      'It teaches your core to hold your spine still while your arms and legs move, which is the same skill that protects your back when you carry something awkward.',
    painAreasItHelps: ['lowerBack'],
    painAreasToMonitor: ['lowerBack', 'neck'],
    substituteExerciseIds: ['pallofPress'],
    mediaBrief: {
      startPosition:
        'Lying on the back on a mat with both arms pointing straight up and both knees stacked over the hips, shins horizontal.',
      endPosition:
        'One arm reaching back overhead and the opposite leg extended low towards the floor, lower back still flat.',
      equipmentToDraw: 'A thin exercise mat under the figure, drawn from the side.',
    },
  },

  {
    exerciseId: 'farmersCarry',
    displayName: "Farmer's Carry",
    shortDisplayName: 'Carry',
    movementCategory: 'strength',
    movementPattern: 'carry',
    primaryMuscleGroups: ['forearmsAndGrip', 'upperTraps', 'abdominals'],
    secondaryMuscleGroups: ['obliques', 'glutes', 'midBack'],
    requiredEquipmentIds: ['dumbbells'],
    loadingStyle: 'dumbbellPair',
    formCues: [
      'Pick a dumbbell up in each hand with a flat back, the same way you would a suitcase.',
      'Stand tall, shoulders back and down, ribs stacked over your hips.',
      'Walk at a normal pace with normal steps. Do not shuffle.',
      'Keep your neck long and look ahead, not at the floor.',
      'Put them down deliberately at the end. Most carry injuries happen at the set-down.',
    ],
    commonMistakes: [
      'Leaning back to counterbalance the weight.',
      'Letting the shoulders round forward, which turns a posture exercise into a posture problem.',
      'Dropping the dumbbells from height at the end.',
    ],
    whyItIsInTheProgramme:
      'It looks trivial and it is quietly excellent: grip, core, posture and conditioning at once, with essentially no injury risk.',
    painAreasItHelps: ['neck', 'shoulders', 'lowerBack'],
    painAreasToMonitor: ['lowerBack', 'shoulders'],
    substituteExerciseIds: [],
    mediaBrief: {
      startPosition:
        'Standing tall in profile mid-stride, a dumbbell hanging at arm’s length beside each hip.',
      endPosition:
        'The same upright posture one stride further on, with the opposite leg forward. The torso never changes shape.',
      equipmentToDraw: 'Two dumbbells hanging at the sides, and a floor line to walk along.',
    },
  },
];
