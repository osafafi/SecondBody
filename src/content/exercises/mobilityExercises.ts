import type { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * The warm-up drills and the at-home "Desk Undo" routine.
 *
 * These are one list because several of them do both jobs — cat-cow, ankle wall
 * rocks, band pull-aparts and chin tucks all appear in the gym warm-up and in
 * the daily routine — and an exercise should be described once, not twice.
 *
 * The warm-up is training, not padding. It is where mobility actually improves.
 * See docs/TRAINING_PROGRAM.md sections 3 and 10.
 */
export const mobilityExercises: ExerciseDefinition[] = [
  {
    exerciseId: 'ankleWallRocks',
    displayName: 'Ankle Wall Rocks',
    shortDisplayName: 'Ankle Rocks',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['calves'],
    secondaryMuscleGroups: [],
    requiredEquipmentIds: ['wall'],
    loadingStyle: 'unloaded',
    formCues: [
      'Stand a hand-span from a wall with one foot forward.',
      'Drive your front knee forward over your toes until it touches the wall.',
      'Keep the heel glued down. The moment it lifts, you have gone too far.',
      'Rock in and out slowly rather than holding.',
    ],
    commonMistakes: [
      'Letting the heel come up, which turns it into a calf stretch and trains nothing.',
      'Letting the knee fall inwards. Track it over the middle toes.',
    ],
    whyItIsInTheProgramme:
      'Stiff ankles are the root cause of most squat problems. If your heels lift when you squat, this is the fix.',
    painAreasItHelps: ['ankles', 'knees'],
    painAreasToMonitor: ['ankles'],
    substituteExerciseIds: [],
    mediaBrief: {
      startPosition:
        'Standing in profile a short step from a wall, one foot forward and flat, knee straight.',
      endPosition:
        'Front knee driven forward until it touches the wall, ankle deeply flexed, heel still flat on the floor.',
      equipmentToDraw: 'A vertical wall line in front of the figure and a floor line beneath it.',
    },
  },

  {
    exerciseId: 'catCow',
    displayName: 'Cat-Cow',
    shortDisplayName: 'Cat-Cow',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['thoracicSpine', 'spinalErectors'],
    secondaryMuscleGroups: ['abdominals'],
    requiredEquipmentIds: ['exerciseMat'],
    loadingStyle: 'unloaded',
    formCues: [
      'On all fours, hands under shoulders and knees under hips.',
      'Breathe out and round your back up towards the ceiling, one vertebra at a time.',
      'Breathe in and reverse it, letting your chest drop and your tailbone lift.',
      'Move slowly and let the movement travel along the spine rather than hinging in one spot.',
    ],
    commonMistakes: [
      'Moving only at the lower back, which is the segment that already moves too much.',
      'Rushing, which turns a mobility drill into a warm-up for nothing.',
    ],
    whyItIsInTheProgramme:
      'It gets your spine moving segment by segment before anything gets loaded, and it is the cheapest way there is to loosen a back that has been in a chair all day.',
    painAreasItHelps: ['lowerBack', 'neck'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: [],
    mediaBrief: {
      startPosition:
        'On all fours in profile with a flat back, hands under the shoulders and knees under the hips.',
      endPosition:
        'Back rounded upwards into a smooth arch with the head tucked, then reversed into a gentle dip with the chest open.',
      equipmentToDraw: 'A thin exercise mat under the hands and knees.',
    },
  },

  {
    exerciseId: 'bandPullApart',
    displayName: 'Band Pull-Apart',
    shortDisplayName: 'Pull-Apart',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['rearDeltoids', 'midBack'],
    secondaryMuscleGroups: ['upperTraps'],
    requiredEquipmentIds: ['resistanceBand'],
    loadingStyle: 'unloaded',
    formCues: [
      'Hold a light band at shoulder width with straight arms out in front of you.',
      'Pull the band apart until your hands are out beside your shoulders.',
      'Squeeze the shoulder blades together at the end of each rep.',
      'Keep your ribs down and your shoulders away from your ears.',
    ],
    commonMistakes: [
      'A band that is too heavy, which turns the shoulders in instead of opening them out.',
      'Shrugging up towards the ears as you pull.',
      'Bending the elbows to get more range.',
    ],
    whyItIsInTheProgramme:
      'It wakes up your mid-back and rear delts before you ask them to work, and it takes about forty seconds.',
    painAreasItHelps: ['neck', 'shoulders'],
    painAreasToMonitor: ['shoulders'],
    substituteExerciseIds: ['cableFacePull'],
    mediaBrief: {
      startPosition:
        'Standing tall facing forward, arms extended in front at shoulder height holding a resistance band at shoulder width.',
      endPosition: 'Arms opened wide out to the sides with the band stretched across the chest.',
      equipmentToDraw: 'A long resistance band held between the two hands.',
    },
  },

  {
    exerciseId: 'wallSlides',
    displayName: 'Wall Slides',
    shortDisplayName: 'Wall Slides',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['midBack', 'rearDeltoids'],
    secondaryMuscleGroups: ['upperTraps', 'thoracicSpine'],
    requiredEquipmentIds: ['wall'],
    loadingStyle: 'unloaded',
    formCues: [
      'Stand with your back, head and arms against a wall, elbows bent at 90 degrees.',
      'Flatten your lower back towards the wall by tucking your ribs down.',
      'Slide your arms up the wall, keeping the wrists and elbows in contact.',
      'Go only as high as you can before the back arches or the arms lift off.',
    ],
    commonMistakes: [
      'Arching the lower back off the wall to get the arms higher. Less range with contact beats more range without.',
      'Shrugging at the top.',
    ],
    whyItIsInTheProgramme:
      'It builds the shoulder blade control that has to exist before anything gets pressed overhead. This is the drill that eventually earns you an overhead press.',
    painAreasItHelps: ['shoulders', 'neck'],
    painAreasToMonitor: ['shoulders'],
    substituteExerciseIds: [],
    mediaBrief: {
      startPosition:
        'Standing with the back against a wall, arms raised against it in a goalpost shape with elbows bent to 90 degrees.',
      endPosition:
        'Arms slid up the wall towards straight overhead, forearms still in contact with the wall.',
      equipmentToDraw:
        'A vertical wall line behind the figure, drawn front-on rather than in profile.',
    },
  },

  {
    exerciseId: 'chinTucks',
    displayName: 'Chin Tucks',
    shortDisplayName: 'Chin Tucks',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['deepNeckFlexors'],
    secondaryMuscleGroups: ['upperTraps'],
    requiredEquipmentIds: ['bodyweightOnly'],
    loadingStyle: 'unloaded',
    formCues: [
      'Sit or stand tall and look straight ahead.',
      'Draw your head straight back over your shoulders, as if making a double chin.',
      'Do not tip your chin down. The movement is backwards, not downwards.',
      'Hold for two seconds and release.',
    ],
    commonMistakes: [
      'Nodding the chin towards the chest instead of gliding the head back.',
      'Doing them hard and fast. Gentle is the whole point.',
    ],
    whyItIsInTheProgramme:
      'It trains the deep neck muscles that hold your head up, and it targets your neck pain about as directly as anything can.',
    painAreasItHelps: ['neck'],
    painAreasToMonitor: ['neck'],
    substituteExerciseIds: [],
    mediaBrief: {
      startPosition:
        'Head and neck in profile with the head sitting slightly forward of the shoulders, as in normal desk posture.',
      endPosition:
        'Head glided straight back so the ears sit over the shoulders, eyes still level and looking forward.',
      equipmentToDraw: 'No equipment. Head, neck and upper torso in profile only.',
    },
  },

  {
    exerciseId: 'bodyweightHipHinge',
    displayName: 'Bodyweight Hip Hinge',
    shortDisplayName: 'Hip Hinge',
    movementCategory: 'mobility',
    movementPattern: 'hinge',
    primaryMuscleGroups: ['hamstrings', 'glutes'],
    secondaryMuscleGroups: ['spinalErectors'],
    requiredEquipmentIds: ['bodyweightOnly'],
    loadingStyle: 'unloaded',
    formCues: [
      'Stand tall with your hands flat on the front of your thighs.',
      'Soften your knees, then push your hips straight back.',
      'Slide your hands down your thighs and stop at the knees.',
      'Stand back up by driving your hips forwards.',
    ],
    commonMistakes: [
      'Squatting instead of hinging. If your knees travel forwards, it is a squat.',
      'Rounding the back to get lower.',
    ],
    whyItIsInTheProgramme:
      'It rehearses the hinge with nothing in your hands, immediately before you do it with something in your hands.',
    painAreasItHelps: ['lowerBack', 'hips'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['dumbbellRomanianDeadlift'],
    mediaBrief: {
      startPosition: 'Standing upright in profile with both palms flat on the front of the thighs.',
      endPosition:
        'Hips pushed back and torso hinged forward to about 45 degrees with a flat back, hands at the knees.',
      equipmentToDraw: 'No equipment. Draw a floor line only.',
    },
  },

  {
    exerciseId: 'foamRollThoracicSpine',
    displayName: 'Foam Roll Thoracic Spine',
    shortDisplayName: 'T-Spine Roll',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['thoracicSpine'],
    secondaryMuscleGroups: ['midBack'],
    requiredEquipmentIds: ['foamRoller', 'exerciseMat'],
    loadingStyle: 'unloaded',
    formCues: [
      'Lie back with the roller across your upper back, below the shoulder blades.',
      'Support your head with your hands and lift your hips off the floor.',
      'Roll slowly between the bottom of your shoulder blades and the top of them.',
      'Stay above the bottom of your ribs. Never roll your lower back.',
    ],
    commonMistakes: [
      'Rolling down onto the lower back, which is the one region you should never roll.',
      'Going too fast to change anything.',
    ],
    whyItIsInTheProgramme:
      'The upper back is where the stiffness from sitting collects. Loosening it first is what lets your shoulders move properly for the rest of the routine.',
    painAreasItHelps: ['neck', 'shoulders', 'lowerBack'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['catCow'],
    mediaBrief: {
      startPosition:
        'Lying on the back in profile with a cylindrical foam roller across the upper back, hips lifted and hands behind the head.',
      endPosition:
        'The body shifted along so the roller has travelled up towards the top of the shoulder blades.',
      equipmentToDraw: 'A cylindrical foam roller beneath the upper back, on a thin mat.',
    },
  },

  {
    exerciseId: 'threadTheNeedle',
    displayName: 'Thread the Needle',
    shortDisplayName: 'Thread Needle',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['thoracicSpine'],
    secondaryMuscleGroups: ['midBack', 'rearDeltoids'],
    requiredEquipmentIds: ['exerciseMat'],
    loadingStyle: 'unloaded',
    formCues: [
      'Start on all fours, hands under shoulders.',
      'Slide one arm underneath your body and across, palm up.',
      'Let that shoulder and the side of your head come down to the mat.',
      'Reach the other way, opening the same arm up towards the ceiling.',
      'Move with your breath rather than forcing the range.',
    ],
    commonMistakes: [
      'Rotating from the lower back rather than the upper back.',
      'Pushing into a range that pinches the shoulder.',
    ],
    whyItIsInTheProgramme:
      'Rotation is the movement a desk takes away first. This gives it back to the part of the spine that is supposed to have it.',
    painAreasItHelps: ['neck', 'shoulders'],
    painAreasToMonitor: ['shoulders', 'neck'],
    substituteExerciseIds: ['foamRollThoracicSpine'],
    mediaBrief: {
      startPosition: 'On all fours on a mat with a flat back, hands under the shoulders.',
      endPosition:
        'One arm threaded underneath the body and out to the far side, that shoulder and the side of the head resting on the mat.',
      equipmentToDraw: 'A thin exercise mat beneath the figure.',
    },
  },

  {
    exerciseId: 'ninetyNinetyHipSwitch',
    displayName: '90/90 Hip Switch',
    shortDisplayName: '90/90 Switch',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['hipFlexors', 'glutes'],
    secondaryMuscleGroups: ['adductors'],
    requiredEquipmentIds: ['exerciseMat'],
    loadingStyle: 'unloaded',
    formCues: [
      'Sit on the floor with one leg bent in front at 90 degrees and the other bent out to the side at 90 degrees.',
      'Sit up tall with your hands lightly on the floor behind you.',
      'Rotate both knees over to the other side, keeping your feet where they are.',
      'Move slowly and control the landing rather than flopping across.',
    ],
    commonMistakes: [
      'Slumping backwards, which takes the hips out of the stretch entirely.',
      'Forcing the front knee down. It gets there over weeks, not in one session.',
    ],
    whyItIsInTheProgramme:
      'This is the drill that gives you hip rotation back. Stiff hips are why your lower back ends up doing their job.',
    painAreasItHelps: ['hips', 'lowerBack'],
    painAreasToMonitor: ['hips', 'knees'],
    substituteExerciseIds: ['couchStretch'],
    mediaBrief: {
      startPosition:
        'Seated on a mat viewed from the front, one leg bent 90 degrees in front and the other bent 90 degrees out to the side, torso upright.',
      endPosition: 'Both knees rotated across to the opposite side into the mirror-image position.',
      equipmentToDraw: 'A thin exercise mat beneath the figure.',
    },
  },

  {
    exerciseId: 'couchStretch',
    displayName: 'Couch Stretch',
    shortDisplayName: 'Couch Stretch',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['hipFlexors', 'quadriceps'],
    secondaryMuscleGroups: ['glutes'],
    requiredEquipmentIds: ['exerciseMat', 'wall'],
    loadingStyle: 'unloaded',
    formCues: [
      'Kneel with your back shin up against a wall and the other foot forward and flat.',
      'Squeeze the glute on the kneeling side. That is what makes this work.',
      'Tuck your ribs down and stand your torso up tall.',
      'Breathe. Back off to where you can hold it for the full forty-five seconds.',
    ],
    commonMistakes: [
      'Arching the lower back to stand upright, which fakes the range and irritates the back.',
      'Going straight to the hardest version. Start with the shin flat on the floor if the wall is too much.',
    ],
    whyItIsInTheProgramme:
      'Six years of sitting leaves the front of the hips short, and short hip flexors pull your pelvis into the position that makes your back ache.',
    painAreasItHelps: ['hips', 'lowerBack'],
    painAreasToMonitor: ['knees', 'lowerBack'],
    substituteExerciseIds: ['ninetyNinetyHipSwitch'],
    mediaBrief: {
      startPosition:
        'Half-kneeling in profile with the rear shin vertical against a wall and the front foot flat on the floor.',
      endPosition:
        'The same position with the torso pulled fully upright and the pelvis tucked, deepening the stretch at the front of the rear hip.',
      equipmentToDraw: 'A vertical wall behind the figure and a mat under the rear knee.',
    },
  },

  {
    exerciseId: 'doorwayPecStretch',
    displayName: 'Doorway Pec Stretch',
    shortDisplayName: 'Pec Stretch',
    movementCategory: 'mobility',
    movementPattern: 'mobility',
    primaryMuscleGroups: ['chest', 'frontDeltoids'],
    secondaryMuscleGroups: [],
    requiredEquipmentIds: ['wall'],
    loadingStyle: 'unloaded',
    formCues: [
      'Put your forearm flat against a door frame with the elbow at shoulder height.',
      'Step through with the same-side foot and turn your chest away.',
      'You should feel it across the front of the chest, not in the shoulder joint.',
      'Hold for thirty seconds and breathe out slowly.',
    ],
    commonMistakes: [
      'Setting the elbow too high, which pinches the front of the shoulder.',
      'Pushing into pain. A stretch should be strong, never sharp.',
    ],
    whyItIsInTheProgramme:
      'Rows and face pulls pull your shoulders back; this lets the front let go. Doing both is what actually changes your resting posture.',
    painAreasItHelps: ['shoulders', 'neck'],
    painAreasToMonitor: ['shoulders'],
    substituteExerciseIds: [],
    mediaBrief: {
      startPosition:
        'Standing beside a door frame with one forearm flat against it, elbow bent to 90 degrees at shoulder height.',
      endPosition:
        'The same-side foot stepped forward and the chest rotated away from the frame, opening the front of the shoulder and chest.',
      equipmentToDraw: 'A vertical door frame edge beside the figure.',
    },
  },
];
