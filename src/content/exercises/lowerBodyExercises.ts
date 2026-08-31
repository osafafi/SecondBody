import type { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * Squats, hinges, lunges and the leg machines.
 *
 * Phase 1 is machine-dominant on purpose: a machine enforces the movement path,
 * so a beginner with four aching joints cannot get it badly wrong. The free
 * weight variants at the bottom of this file are earned in Phase 3, once the
 * pattern is grooved. See docs/TRAINING_PROGRAM.md section 2.
 *
 * The building gym has no leg press and no hip thrust machine, so the loaded
 * squat pattern is the goblet squat and the glute work is a dumbbell hip thrust
 * off a bench. What the gym does have - leg extension, leg curl, adductor and
 * abductor - is all here.
 */
export const lowerBodyExercises: ExerciseDefinition[] = [
  {
    exerciseId: 'legExtension',
    displayName: 'Leg Extension',
    shortDisplayName: 'Leg Extension',
    movementCategory: 'strength',
    movementPattern: 'isolation',
    primaryMuscleGroups: ['quadriceps'],
    secondaryMuscleGroups: [],
    requiredEquipmentIds: ['legExtensionMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Line the machine up so the pivot sits level with your knee joint.',
      'Sit right back so your thighs stay flat on the seat for the whole set.',
      'Straighten your legs over about two seconds, without snapping them out.',
      'Pause for a beat at the top, then lower slower than you lifted.',
    ],
    commonMistakes: [
      'Kicking the weight up and letting it drop back, which is the one way this movement can annoy a knee.',
      'Sliding forward off the backrest so the hips help.',
      'Setting the pivot too low, which drags the load across the front of the knee.',
    ],
    whyItIsInTheProgramme:
      'Direct quad work with your back fully supported. Strong quads take load off the knee joint itself, and this is the only machine in the building that trains them on their own.',
    painAreasItHelps: ['knees'],
    painAreasToMonitor: ['knees'],
    substituteExerciseIds: ['gobletSquatToBox', 'splitSquat'],
    mediaBrief: {
      startPosition:
        'Seated upright in a leg extension machine with the back against the pad, knees bent over the front of the seat and a roller across the ankles.',
      endPosition:
        'Legs extended forward to almost straight, the ankle roller lifted, thighs still flat on the seat.',
      equipmentToDraw:
        'A seated leg extension machine: seat back, thigh pad and an ankle roller on a pivoting arm, weight stack implied behind.',
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
    exerciseId: 'seatedHipAbduction',
    displayName: 'Seated Hip Abduction',
    shortDisplayName: 'Abductor',
    movementCategory: 'strength',
    movementPattern: 'isolation',
    primaryMuscleGroups: ['glutes'],
    secondaryMuscleGroups: [],
    requiredEquipmentIds: ['hipAbductorMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Sit tall with the pads against the outside of your knees, not your shins.',
      'Push your knees apart smoothly and stop where the movement stops being easy.',
      'Hold the wide position for a full second before you let it back.',
      'Come back slowly. Do not let the stack clang.',
      'Lean forward slightly if you want to feel it higher on the side of the hip.',
    ],
    commonMistakes: [
      'Going so heavy that you have to rock the whole torso to move the pads.',
      'Letting the weight slam the knees back together, which is where a sore hip complains.',
      'Sitting slouched, which quietly turns it into a lower back exercise.',
    ],
    whyItIsInTheProgramme:
      'The muscles on the side of your hip are what stop the knee falling inwards on a squat and what keep your pelvis level when you walk. Weak ones show up as knee ache and hip ache — and this machine trains them with nothing at all loading your spine.',
    painAreasItHelps: ['hips', 'knees', 'lowerBack'],
    painAreasToMonitor: ['hips'],
    substituteExerciseIds: ['splitSquat', 'dumbbellHipThrust'],
    mediaBrief: {
      startPosition:
        'Seated upright in an abductor machine viewed from the front, knees together with a pad against the outside of each knee.',
      endPosition:
        'Knees pushed wide apart against the pads, torso still upright and hips flat on the seat.',
      equipmentToDraw:
        'A seated abduction machine from the front: seat, backrest and two pivoting knee pads, weight stack implied.',
    },
  },

  {
    exerciseId: 'seatedHipAdduction',
    displayName: 'Seated Hip Adduction',
    shortDisplayName: 'Adductor',
    movementCategory: 'strength',
    movementPattern: 'isolation',
    primaryMuscleGroups: ['adductors'],
    secondaryMuscleGroups: [],
    requiredEquipmentIds: ['hipAdductorMachine'],
    loadingStyle: 'weightStackMachine',
    formCues: [
      'Set the starting width so you feel a stretch, not a strain. Narrow at first.',
      'Sit tall and squeeze your knees together over about two seconds.',
      'Hold the squeeze for a beat in the middle.',
      'Let the knees travel back out slowly and under control.',
    ],
    commonMistakes: [
      'Setting the starting position far too wide on the first set. That is the one way to strain a groin on this machine.',
      'Letting the weight fling the legs apart on the way back.',
    ],
    whyItIsInTheProgramme:
      'Not in the written sessions — it is here for the day the abductor machine is busy, or the knees will not take a lunge. Your adductors work hard on every squat and every split squat, and training them seated loads nothing that currently hurts.',
    painAreasItHelps: ['hips'],
    painAreasToMonitor: ['hips'],
    substituteExerciseIds: ['gobletSquatToBox', 'splitSquat'],
    mediaBrief: {
      startPosition:
        'Seated upright in an adductor machine viewed from the front, knees apart with a pad against the inside of each knee.',
      endPosition: 'Knees squeezed together in front of the body, torso still upright.',
      equipmentToDraw:
        'A seated adduction machine from the front: seat, backrest and two pivoting inner-knee pads, weight stack implied.',
    },
  },

  {
    exerciseId: 'gobletSquatToBox',
    displayName: 'Goblet Squat to Bench',
    shortDisplayName: 'Goblet Squat',
    movementCategory: 'strength',
    movementPattern: 'squat',
    primaryMuscleGroups: ['quadriceps', 'glutes'],
    secondaryMuscleGroups: ['adductors', 'abdominals', 'spinalErectors'],
    requiredEquipmentIds: ['dumbbells', 'flatBench'],
    loadingStyle: 'singleDumbbell',
    formCues: [
      'Set a flat bench behind you and stand just in front of it.',
      'Hold one dumbbell vertically against your chest, elbows tucked in under it.',
      'Feet a little wider than your shoulders, toes turned out slightly.',
      'Sit back and down until you touch the bench, then stand straight back up.',
      'Touch the bench, do not sit down on it.',
      'Keep your chest up. The dumbbell is a counterweight, let it help you.',
    ],
    commonMistakes: [
      'Dropping onto the bench and losing tension.',
      'Knees caving inwards on the way up. Push them out towards your little toes.',
      'Heels lifting, which is an ankle mobility problem — the wall rocks in the warm-up are the fix.',
    ],
    whyItIsInTheProgramme:
      'It is the biggest thing you do on Monday, and it teaches the squat pattern with a counterweight that makes good form easier than bad form. The bench gives you a consistent depth to hit instead of guessing at it.',
    painAreasItHelps: ['knees', 'hips', 'ankles'],
    painAreasToMonitor: ['knees', 'lowerBack'],
    substituteExerciseIds: ['splitSquat', 'legExtension', 'seatedHipAdduction'],
    mediaBrief: {
      startPosition:
        'Standing in front of a flat bench, holding a single dumbbell vertically against the chest with both hands.',
      endPosition:
        'Squatted down until the hips lightly touch the bench, torso upright, dumbbell still at the chest.',
      equipmentToDraw:
        'A flat bench behind the figure and one vertical dumbbell held at the chest.',
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
    substituteExerciseIds: ['gobletSquatToBox', 'legExtension', 'seatedHipAdduction'],
    mediaBrief: {
      startPosition:
        'Standing in a long split stance, front foot flat, back heel raised, torso upright and arms at the sides.',
      endPosition:
        'Back knee lowered to just above the floor, front shin close to vertical, torso still upright.',
      equipmentToDraw: 'No equipment. Draw a floor line only.',
    },
  },

  {
    exerciseId: 'dumbbellHipThrust',
    displayName: 'Dumbbell Hip Thrust',
    shortDisplayName: 'Hip Thrust',
    movementCategory: 'strength',
    movementPattern: 'hinge',
    primaryMuscleGroups: ['glutes'],
    secondaryMuscleGroups: ['hamstrings', 'quadriceps', 'abdominals'],
    requiredEquipmentIds: ['dumbbells', 'flatBench'],
    loadingStyle: 'singleDumbbell',
    formCues: [
      'Sit on the floor with your shoulder blades against the long edge of a flat bench.',
      'Rest one dumbbell across your hip crease and hold it there with both hands.',
      'Feet flat and shoulder width, close enough in that your shins go vertical at the top.',
      'Tuck your chin and keep your ribs down before you move.',
      'Drive through your heels until your hips are level with your knees.',
      'Squeeze hard at the top for a full second, then lower under control.',
    ],
    commonMistakes: [
      'Arching the lower back at the top instead of finishing with the glutes. If you feel it in your back, you went too far.',
      'Pushing through the toes, which turns it into a quad exercise.',
      'Letting the bench slide away. Put it against a wall before the first rep.',
      'Resting the dumbbell on the hip bones rather than the crease. Fold a towel under it if it digs in.',
    ],
    whyItIsInTheProgramme:
      'It is the most direct glute exercise there is, and weak glutes are very often the real reason a lower back hurts — the back ends up doing the hips’ job. There is no hip thrust machine in the building, so a bench and one dumbbell do it instead.',
    painAreasItHelps: ['lowerBack', 'hips'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['dumbbellRomanianDeadlift', 'seatedHipAbduction'],
    mediaBrief: {
      startPosition:
        'Seated on the floor in profile with the upper back against the edge of a flat bench, knees bent, feet flat, hips low and a dumbbell across the hip crease.',
      endPosition:
        'Hips driven up so the torso is horizontal and level with the knees, shins vertical, the dumbbell still held across the hips.',
      equipmentToDraw:
        'A flat bench behind the shoulders and a single dumbbell lying across the hips, held by both hands.',
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
      'This is where the hinge gets taught: light, slow, and drilled until it is automatic. It stays on dumbbells for all twelve weeks — that is plenty of load for a first programme, and it never asks you to pick a barbell up off the floor.',
    painAreasItHelps: ['lowerBack', 'hips'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['seatedLegCurl', 'barbellRomanianDeadlift', 'dumbbellHipThrust'],
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
  // Earned later: the free weight progressions introduced in Phase 3.
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
      'Cutting the depth short now that the bench is gone. Go at least as low as you were touching before.',
      'Letting the elbows flare out, which pulls the chest down with them.',
    ],
    whyItIsInTheProgramme:
      'Same movement as the version to a bench, without the bench telling you where the bottom is. You have earned that by Phase 3.',
    painAreasItHelps: ['knees', 'hips', 'ankles'],
    painAreasToMonitor: ['knees', 'lowerBack'],
    substituteExerciseIds: ['gobletSquatToBox', 'splitSquat', 'legExtension'],
    mediaBrief: {
      startPosition:
        'Standing with feet slightly wider than the shoulders, holding a single dumbbell vertically at the chest.',
      endPosition:
        'Squatted to thighs parallel or below, torso upright, dumbbell still held at the chest.',
      equipmentToDraw: 'One vertical dumbbell held at the chest. No bench.',
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

  // ---------------------------------------------------------------------------
  // Described but not prescribed.
  //
  // The barbell Romanian deadlift has to be lifted out of a rack at hip height,
  // and the building gym has bars without a rack anyone has confirmed. It stays
  // here as the dumbbell RDL's first listed substitute, so that finding a rack
  // is a one-line change to the Phase 3 template rather than a new exercise.
  // ---------------------------------------------------------------------------

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
      'Starting from the floor. If there is nothing to lift it out of at hip height, do the dumbbell version instead. That is not settling, it is the right call.',
    ],
    whyItIsInTheProgramme:
      'It is not, yet. The barbell hinge is written up and ready for the day there is a rack to take a bar out of at hip height. Until then the dumbbell version does the same job and never asks you to lift a bar off the floor.',
    painAreasItHelps: ['lowerBack', 'hips'],
    painAreasToMonitor: ['lowerBack'],
    substituteExerciseIds: ['dumbbellRomanianDeadlift', 'dumbbellHipThrust'],
    mediaBrief: {
      startPosition:
        'Standing upright in profile holding a barbell across the front of the thighs with an overhand grip, knees softly bent.',
      endPosition:
        'Hips pushed back, torso hinged to roughly 45 degrees with a flat back, bar just below the knees and touching the legs.',
      equipmentToDraw: 'A straight barbell with a plate visible at the near end.',
    },
  },
];
