import type { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * Squats, hinges, lunges and the leg machines.
 *
 * Phase 1 is machine-dominant on purpose: a machine enforces the movement path,
 * so a beginner with four aching joints cannot get it badly wrong. The free
 * weight variants at the bottom of this file are earned in Phase 2 and 3, once
 * the pattern is grooved. See docs/TRAINING_PROGRAM.md section 2.
 */
export const lowerBodyExercises: ExerciseDefinition[] = [
  {
    exerciseId: 'legPress',
    displayName: 'Leg Press',
    shortDisplayName: 'Leg Press',
    movementCategory: 'strength',
    movementPattern: 'squat',
    primaryMuscleGroups: ['quadriceps', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'adductors'],
    requiredEquipmentIds: ['legPressMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Sit right back so your whole spine is against the pad, hips included.',
      'Feet flat on the platform, shoulder width, toes turned out a touch.',
      'Lower until your knees reach about 90 degrees, slower than feels necessary.',
      'Push through your whole foot, mid-foot and heel, not the toes.',
      'Stop just short of locking the knees out at the top.',
    ],
    commonMistakes: [
      'Letting the lower back round and lift off the pad at the bottom. That is the point to stop at, not push through.',
      'Bouncing out of the bottom. The rep starts from a dead stop.',
      'Snapping the knees straight at the top, which dumps the load onto the joint instead of the muscle.',
      'Feet too low on the platform, which turns it into a knee exercise.',
    ],
    whyItIsInTheProgramme:
      'It loads the knees and hips heavily with your back fully supported, which is the safest way to start training legs when the lower back is unhappy.',
    painAreasItHelps: ['knees', 'lowerBack'],
    painAreasToMonitor: ['knees', 'lowerBack'],
    substituteExerciseIds: ['gobletSquatToBox', 'splitSquat'],
    mediaBrief: {
      startPosition:
        'Seated in a 45-degree leg press with the back against the pad, knees bent to roughly 90 degrees and feet flat on the platform.',
      endPosition:
        'Legs extended along the sled path but stopping short of a locked knee, hips still fully seated.',
      equipmentToDraw:
        'An angled leg press sled with a footplate and a seat back, weight stack implied behind the sled.',
    },
  },

  {
    exerciseId: 'seatedLegCurl',
    displayName: 'Seated Leg Curl',
    shortDisplayName: 'Leg Curl',
    movementCategory: 'strength',
    movementPattern: 'isolation',
    primaryMuscleGroups: ['hamstrings'],
    secondaryMuscleGroups: ['calves'],
    requiredEquipmentIds: ['seatedLegCurlMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Line the machine up so the pivot sits level with your knee joint.',
      'Pull the thigh pad down snug before you start, so your hips cannot lift.',
      'Curl your heels under the seat, taking about two seconds.',
      'Let it back out slowly. The way back up is where most of the work is.',
    ],
    commonMistakes: [
      'Letting the weight yank your legs straight at the end of each rep.',
      'Lifting the hips to help, which means the hamstrings stopped working.',
      'Setting the pivot too high, which puts the load through the knee instead of the muscle.',
    ],
    whyItIsInTheProgramme:
      'Six years of sitting shortens the hamstrings and switches them off. Training them directly is part of what takes the load off your lower back.',
    painAreasItHelps: ['lowerBack', 'knees'],
    painAreasToMonitor: ['knees'],
    substituteExerciseIds: ['dumbbellRomanianDeadlift'],
    mediaBrief: {
      startPosition:
        'Seated in a leg curl machine with legs extended forward, thigh pad across the lap and a roller behind the ankles.',
      endPosition: 'Knees bent so the ankle roller is drawn down and back under the seat.',
      equipmentToDraw:
        'A seated leg curl machine: seat back, thigh restraint pad and an ankle roller on a pivoting arm.',
    },
  },

  {
    exerciseId: 'gobletSquatToBox',
    displayName: 'Goblet Squat to Box',
    shortDisplayName: 'Goblet Squat',
    movementCategory: 'strength',
    movementPattern: 'squat',
    primaryMuscleGroups: ['quadriceps', 'glutes'],
    secondaryMuscleGroups: ['adductors', 'abdominals', 'spinalErectors'],
    requiredEquipmentIds: ['dumbbells', 'plyometricBox'],
    loadingStyle: 'singleDumbbell',
    formCues: [
      'Hold one dumbbell vertically against your chest, elbows tucked in under it.',
      'Feet a little wider than your shoulders, toes turned out slightly.',
      'Sit back and down until you touch the box, then stand straight back up.',
      'Touch the box, do not sit down on it.',
      'Keep your chest up. The dumbbell is a counterweight, let it help you.',
    ],
    commonMistakes: [
      'Dropping onto the box and losing tension.',
      'Knees caving inwards on the way up. Push them out towards your little toes.',
      'Heels lifting, which is an ankle mobility problem — the wall rocks in the warm-up are the fix.',
    ],
    whyItIsInTheProgramme:
      'It teaches the squat pattern with a counterweight that makes good form easier than bad form. The box gives you a consistent depth to hit instead of guessing.',
    painAreasItHelps: ['knees', 'hips', 'ankles'],
    painAreasToMonitor: ['knees', 'lowerBack'],
    substituteExerciseIds: ['legPress', 'splitSquat'],
    mediaBrief: {
      startPosition:
        'Standing in front of a low box, holding a single dumbbell vertically against the chest with both hands.',
      endPosition:
        'Squatted down until the hips lightly touch the box, torso upright, dumbbell still at the chest.',
      equipmentToDraw:
        'A low plyometric box behind the figure and one vertical dumbbell at the chest.',
    },
  },

  {
    exerciseId: 'splitSquat',
    displayName: 'Split Squat',
    shortDisplayName: 'Split Squat',
    movementCategory: 'strength',
    movementPattern: 'lunge',
    primaryMuscleGroups: ['quadriceps', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'adductors', 'abdominals'],
    requiredEquipmentIds: ['bodyweightOnly'],
    loadingStyle: 'bodyweight',
    formCues: [
      'Step one foot forward into a long stance, back heel off the floor.',
      'Drop straight down, not forward. The back knee travels towards the floor.',
      'Stop an inch above the floor with the back knee, then drive up through the front heel.',
      'Hold something light for balance at first if you need to. That is not cheating.',
    ],
    commonMistakes: [
      'Too short a stance, which crowds the front knee and makes it ache.',
      'Leaning forward over the front leg instead of dropping straight down.',
      'Rushing. This one is a balance exercise as much as a strength one.',
    ],
    whyItIsInTheProgramme:
      'One leg at a time exposes the side that is weaker, and it loads the hips hard without needing any load on your spine at all.',
    painAreasItHelps: ['hips', 'knees'],
    painAreasToMonitor: ['knees', 'hips'],
    substituteExerciseIds: ['gobletSquatToBox', 'legPress'],
    mediaBrief: {
      startPosition:
        'Standing in a long split stance, front foot flat, back heel raised, torso upright and arms at the sides.',
      endPosition:
        'Back knee lowered to just above the floor, front shin close to vertical, torso still upright.',
      equipmentToDraw: 'No equipment. Draw a floor line only.',
    },
  },

  {
    exerciseId: 'hipThrust',
    displayName: 'Hip Thrust',
    shortDisplayName: 'Hip Thrust',
    movementCategory: 'strength',
    movementPattern: 'hinge',
    primaryMuscleGroups: ['glutes'],
    secondaryMuscleGroups: ['hamstrings', 'quadriceps', 'abdominals'],
    requiredEquipmentIds: ['hipThrustMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Sit with your shoulder blades against the pad, feet flat and shoulder width.',
      'Tuck your chin and keep your ribs down before you move.',
      'Drive through your heels until your hips are level with your knees.',
      'Squeeze hard at the top for a full second, then lower under control.',
      'Stop when your hips are level. Do not arch past it.',
    ],
    commonMistakes: [
      'Arching the lower back at the top instead of finishing with the glutes. If you feel it in your back, you went too far.',
      'Pushing through the toes, which turns it into a quad exercise.',
      'Feet too close in, which does the same thing.',
    ],
    whyItIsInTheProgramme:
      'It is the most direct glute exercise there is, and weak glutes are very often the real reason a lower back hurts — the back ends up doing the hips’ job.',
    painAreasItHelps: ['lowerBack', 'hips'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['dumbbellRomanianDeadlift'],
    mediaBrief: {
      startPosition:
        'Seated on the floor with the upper back against a padded bench, knees bent, feet flat, hips low and a padded bar across the hips.',
      endPosition:
        'Hips driven up so the torso is horizontal and level with the knees, shins vertical.',
      equipmentToDraw:
        'A padded bench behind the shoulders and a padded weight bar across the hips.',
    },
  },

  {
    exerciseId: 'dumbbellRomanianDeadlift',
    displayName: 'Dumbbell Romanian Deadlift',
    shortDisplayName: 'DB RDL',
    movementCategory: 'strength',
    movementPattern: 'hinge',
    primaryMuscleGroups: ['hamstrings', 'glutes'],
    secondaryMuscleGroups: ['spinalErectors', 'midBack', 'forearmsAndGrip'],
    requiredEquipmentIds: ['dumbbells'],
    loadingStyle: 'dumbbellPair',
    formCues: [
      'Stand tall with a dumbbell in each hand, resting against the front of your thighs.',
      'Soften the knees once and then leave them there. This is a hip movement, not a squat.',
      'Push your hips back and let the dumbbells slide down your thighs.',
      'Stop when you feel a strong stretch in the hamstrings, usually just below the knee.',
      'Drive your hips forward to stand up. Squeeze the glutes at the top.',
    ],
    commonMistakes: [
      'Rounding the lower back to reach further down. Range of motion is whatever you can keep a flat back for, and no more.',
      'Turning it into a squat by bending the knees more as you descend.',
      'Letting the dumbbells drift away from the legs, which loads the lower back.',
    ],
    whyItIsInTheProgramme:
      'This is where the hinge gets taught: light, slow, and drilled until it is automatic. Everything heavier later depends on it.',
    painAreasItHelps: ['lowerBack', 'hips'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['seatedLegCurl', 'hipThrust'],
    mediaBrief: {
      startPosition:
        'Standing upright in profile with a dumbbell in each hand hanging at the front of the thighs, knees softly bent.',
      endPosition:
        'Hips pushed back and torso hinged forward to roughly 45 degrees, back flat, dumbbells just below the knees.',
      equipmentToDraw:
        'Two dumbbells, one in each hand, drawn in profile so only the near one is prominent.',
    },
  },

  // ---------------------------------------------------------------------------
  // Earned later: the free weight progressions introduced in Phase 2 and 3.
  // ---------------------------------------------------------------------------

  {
    exerciseId: 'gobletSquat',
    displayName: 'Goblet Squat',
    shortDisplayName: 'Goblet Squat',
    movementCategory: 'strength',
    movementPattern: 'squat',
    primaryMuscleGroups: ['quadriceps', 'glutes'],
    secondaryMuscleGroups: ['adductors', 'abdominals', 'spinalErectors'],
    requiredEquipmentIds: ['dumbbells'],
    loadingStyle: 'singleDumbbell',
    formCues: [
      'Hold one dumbbell vertically against your chest, elbows tucked under it.',
      'Sit down between your hips until your thighs are at least parallel to the floor.',
      'Keep your chest up and your whole foot planted.',
      'Stand up without letting the knees drift inwards.',
    ],
    commonMistakes: [
      'Cutting the depth short now that the box is gone. Go at least as low as you were touching before.',
      'Letting the elbows flare out, which pulls the chest down with them.',
    ],
    whyItIsInTheProgramme:
      'Same movement as the box version, without the box telling you where the bottom is. You have earned that by Phase 3.',
    painAreasItHelps: ['knees', 'hips', 'ankles'],
    painAreasToMonitor: ['knees', 'lowerBack'],
    substituteExerciseIds: ['gobletSquatToBox', 'legPress'],
    mediaBrief: {
      startPosition:
        'Standing with feet slightly wider than the shoulders, holding a single dumbbell vertically at the chest.',
      endPosition:
        'Squatted to thighs parallel or below, torso upright, dumbbell still held at the chest.',
      equipmentToDraw: 'One vertical dumbbell held at the chest. No box.',
    },
  },

  {
    exerciseId: 'dumbbellSplitSquat',
    displayName: 'Dumbbell Split Squat',
    shortDisplayName: 'DB Split Squat',
    movementCategory: 'strength',
    movementPattern: 'lunge',
    primaryMuscleGroups: ['quadriceps', 'glutes'],
    secondaryMuscleGroups: ['hamstrings', 'adductors', 'abdominals', 'forearmsAndGrip'],
    requiredEquipmentIds: ['dumbbells'],
    loadingStyle: 'dumbbellPair',
    formCues: [
      'Hold a dumbbell in each hand, hanging at your sides.',
      'Step into the same long stance you have been using, back heel off the floor.',
      'Drop straight down until the back knee is just above the floor.',
      'Drive up through the front heel without letting the dumbbells swing.',
    ],
    commonMistakes: [
      'Adding weight before the bodyweight version is genuinely steady. Balance first, load second.',
      'Letting the torso drift forward once the hands are loaded.',
    ],
    whyItIsInTheProgramme:
      'This is the split squat with load added, which is exactly what the bodyweight version was building towards. You earned it.',
    painAreasItHelps: ['hips', 'knees'],
    painAreasToMonitor: ['knees', 'hips'],
    substituteExerciseIds: ['splitSquat', 'gobletSquat'],
    mediaBrief: {
      startPosition:
        'Standing in a long split stance in profile with a dumbbell hanging at each side, front foot flat and back heel raised.',
      endPosition:
        'Back knee lowered to just above the floor, torso upright, dumbbells still hanging straight down.',
      equipmentToDraw: 'Two dumbbells hanging at the sides, and a floor line.',
    },
  },

  {
    exerciseId: 'barbellRomanianDeadlift',
    displayName: 'Barbell Romanian Deadlift',
    shortDisplayName: 'Barbell RDL',
    movementCategory: 'strength',
    movementPattern: 'hinge',
    primaryMuscleGroups: ['hamstrings', 'glutes'],
    secondaryMuscleGroups: ['spinalErectors', 'midBack', 'forearmsAndGrip'],
    requiredEquipmentIds: ['barbell'],
    loadingStyle: 'barbell',
    formCues: [
      'Lift the bar out of the rack at hip height. This one never starts from the floor.',
      'Soften the knees once, then push the hips back and let the bar run down your thighs.',
      'Keep the bar touching your legs the whole way. If it drifts, your back takes it.',
      'Stop at the stretch, then drive the hips forward to stand.',
    ],
    commonMistakes: [
      'Going heavier than the hinge can hold. The back rounds long before the hamstrings run out.',
      'Starting from the floor. Take it out of the rack.',
    ],
    whyItIsInTheProgramme:
      'The barbell version of a pattern you have been drilling for eight weeks. It is here because by Phase 3 the hinge is reliable, not because heavier is better.',
    painAreasItHelps: ['lowerBack', 'hips'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['dumbbellRomanianDeadlift', 'hipThrust'],
    mediaBrief: {
      startPosition:
        'Standing upright in profile holding a barbell across the front of the thighs with an overhand grip, knees softly bent.',
      endPosition:
        'Hips pushed back, torso hinged to roughly 45 degrees with a flat back, bar just below the knees and touching the legs.',
      equipmentToDraw: 'A straight barbell with a plate visible at the near end.',
    },
  },
];
