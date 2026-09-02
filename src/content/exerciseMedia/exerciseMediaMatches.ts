import type { ExerciseMediaMatch, ExerciseWithoutMediaMatch } from './exerciseMediaTypes';

/**
 * Which animation belongs to which exercise, and where it came from.
 *
 * **This table was built by looking at the drawings, not by comparing strings.**
 * Every `gymVisualDataset` entry below was chosen by opening the dataset's
 * thumbnail for the candidate and checking that the movement in the picture is
 * the movement in the exercise brief. That is why it is committed content rather
 * than something a script recomputes: a fuzzy name match would happily pair
 * "Seated Leg Curl" with "biceps leg concentration curl", and nobody would
 * notice until a gym.
 *
 * The rule for accepting a match is that the animation must not teach anything
 * false. A different grip is a note; a different movement is a rejection, and a
 * rejection goes in `exercisesWithoutMediaMatch` below, where it shows up in the
 * app as "No preview yet" rather than being quietly wrong.
 *
 * The `generatedForThisApp` entries are the movements the dataset had nothing
 * honest for, drawn for this app instead of matched. They are checked the same
 * way — by looking at the frames — but against the brief rather than against a
 * record, so each one says what its frames show.
 *
 * Adding a dataset match is three steps: put the row here, run
 * `npm run media:copy`, and commit the `.gif` it writes. A generated one is two:
 * put the row here and commit the file, which `media:copy` will not touch.
 */
export const exerciseMediaMatches: ExerciseMediaMatch[] = [
  // ---------------------------------------------------------------------------
  // Lower body
  // ---------------------------------------------------------------------------
  {
    exerciseId: 'legExtension',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0585',
    datasetExerciseName: 'lever leg extension',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'seatedLegCurl',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0599',
    datasetExerciseName: 'lever seated leg curl',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'seatedHipAbduction',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0597',
    datasetExerciseName: 'lever seated hip abduction',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'seatedHipAdduction',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0598',
    datasetExerciseName: 'lever seated hip adduction',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'gobletSquat',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '1760',
    datasetExerciseName: 'dumbbell goblet squat',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'gobletSquatToBox',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '1760',
    datasetExerciseName: 'dumbbell goblet squat',
    matchQuality: 'close',
    differenceFromOurVersion:
      'The same goblet squat without the bench, so it shows the hold but not the depth target. The dataset does have a squat to a bench (0291, "dumbbell bench squat"), but it holds the dumbbells at the sides, which contradicts the cue that matters most here. Sharing the goblet squat drawing was the smaller lie.',
  },
  {
    exerciseId: 'splitSquat',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '2368',
    datasetExerciseName: 'split squats',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'dumbbellSplitSquat',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0410',
    datasetExerciseName: 'dumbbell single leg split squat',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'dumbbellHipThrust',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '1409',
    datasetExerciseName: 'barbell glute bridge',
    matchQuality: 'close',
    differenceFromOurVersion:
      'Shoulders on the floor rather than against a bench, and a barbell rather than a dumbbell. It is the right hip extension against a load held across the hips, over a shorter range. The dataset has no hip thrust at all.',
  },
  {
    exerciseId: 'dumbbellRomanianDeadlift',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '1459',
    datasetExerciseName: 'dumbbell romanian deadlift',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'barbellRomanianDeadlift',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0085',
    datasetExerciseName: 'barbell romanian deadlift',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },

  // ---------------------------------------------------------------------------
  // Upper body, pulling
  // ---------------------------------------------------------------------------
  {
    exerciseId: 'seatedCableRow',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0180',
    datasetExerciseName: 'cable low seated row',
    matchQuality: 'close',
    differenceFromOurVersion:
      'A straight bar rather than the neutral-grip handle. Same machine, same seated position, same pull to the navel.',
  },
  {
    exerciseId: 'latPulldown',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0818',
    datasetExerciseName: 'twin handle parallel grip lat pulldown',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'chestSupportedDumbbellRow',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '1331',
    datasetExerciseName: 'dumbbell reverse grip incline bench two arm row',
    matchQuality: 'close',
    differenceFromOurVersion:
      'An underhand grip rather than a neutral one. The chest support, the incline bench and both dumbbells are right, which is the whole point of the exercise.',
  },
  {
    exerciseId: 'cableFacePull',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0203',
    datasetExerciseName: 'cable rear delt row (with rope)',
    matchQuality: 'close',
    differenceFromOurVersion:
      'The dataset files face pulls under this name. High pulley, rope, elbows high, pulled towards the face — it is the movement, under a different label.',
  },

  // ---------------------------------------------------------------------------
  // Upper body, pushing
  // ---------------------------------------------------------------------------
  {
    exerciseId: 'chestPressMachine',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0577',
    datasetExerciseName: 'lever chest press',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'inclineDumbbellPress',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0314',
    datasetExerciseName: 'dumbbell incline bench press',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'shoulderPressMachine',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '2318',
    datasetExerciseName: 'lever shoulder press v. 3',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },

  // ---------------------------------------------------------------------------
  // Core and carries
  // ---------------------------------------------------------------------------
  {
    exerciseId: 'pallofPress',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0979',
    datasetExerciseName: 'band horizontal pallof press',
    matchQuality: 'close',
    differenceFromOurVersion:
      'A band rather than the cable station. The anti-rotation press, the stance and the resistance arriving from the side are all right.',
  },
  {
    exerciseId: 'deadBug',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0276',
    datasetExerciseName: 'dead bug',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'farmersCarry',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '2133',
    datasetExerciseName: 'farmers walk',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },

  // ---------------------------------------------------------------------------
  // Cardio
  // ---------------------------------------------------------------------------
  {
    exerciseId: 'inclineTreadmillWalk',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '3666',
    datasetExerciseName: 'walking on incline treadmill',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'stationaryBikeEasy',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0798',
    datasetExerciseName: 'stationary bike walk',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'ellipticalEasy',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '2141',
    datasetExerciseName: 'walk elliptical cross trainer',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'rowingMachineEasy',
    mediaSource: 'generatedForThisApp',
    whatTheAnimationShows:
      'Four frames on an air rower: the catch with the shins vertical, the leg drive, the finish with the handle at the ribs, and the recovery back up the slide. The dataset has no rowing ergometer at all.',
  },

  // ---------------------------------------------------------------------------
  // Mobility and warm-up
  // ---------------------------------------------------------------------------
  {
    exerciseId: 'bandPullApart',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '0993',
    datasetExerciseName: 'band reverse fly',
    matchQuality: 'close',
    differenceFromOurVersion:
      'Filed as a reverse fly, but the drawing is a band held at chest height and pulled apart to arms wide, which is the pull-apart.',
  },
  {
    exerciseId: 'foamRollThoracicSpine',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '2208',
    datasetExerciseName: 'roller back stretch',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'ankleWallRocks',
    mediaSource: 'gymVisualDataset',
    datasetExerciseId: '1407',
    datasetExerciseName: 'calf push stretch with hands against wall',
    matchQuality: 'close',
    differenceFromOurVersion:
      'A held calf stretch rather than a rocking one, but it is the same split stance at the same wall driving the same ankle into dorsiflexion.',
  },
  {
    exerciseId: 'catCow',
    mediaSource: 'generatedForThisApp',
    whatTheAnimationShows:
      'Two frames on all fours: the spine rounded to the ceiling with the head tucked, then dropped into extension with the chest open and the tailbone up.',
  },
  {
    exerciseId: 'threadTheNeedle',
    mediaSource: 'generatedForThisApp',
    whatTheAnimationShows:
      'Two frames from all fours: the arm threaded under the body with the shoulder down on the mat, then opened to a reach at the ceiling.',
  },
  {
    exerciseId: 'wallSlides',
    mediaSource: 'generatedForThisApp',
    whatTheAnimationShows:
      'Two frames with the back against a wall: the forearm at shoulder height, then slid overhead with the contact kept the whole way.',
  },
  {
    exerciseId: 'chinTucks',
    mediaSource: 'generatedForThisApp',
    whatTheAnimationShows:
      'Two frames of the neck in profile: the head drifted forward, then drawn back over the shoulders, with the cervical spine picked out.',
  },
  {
    exerciseId: 'bodyweightHipHinge',
    mediaSource: 'generatedForThisApp',
    whatTheAnimationShows:
      'Two frames from the side: standing tall, then hinged over with a flat back and the hands sliding down the thighs, glutes and hamstrings loaded.',
  },
  {
    exerciseId: 'couchStretch',
    mediaSource: 'generatedForThisApp',
    whatTheAnimationShows:
      'Two frames of the half-kneeling position with the rear shin up a wall and the knee on a pad, sinking into the position that loads the hip flexor and quad.',
  },
  {
    exerciseId: 'doorwayPecStretch',
    mediaSource: 'generatedForThisApp',
    whatTheAnimationShows:
      'Two frames with the forearm on a doorframe at shoulder height: square to the door, then turned away from the arm so the chest lengthens.',
  },
];

/**
 * The exercises the dataset has nothing honest to offer.
 *
 * These draw the "No preview yet" fallback. Each note records what was searched
 * for and what the nearest miss was, so the next person to look does not repeat
 * the search — and so the reason is a fact on the page rather than something
 * that has to be taken on trust.
 */
export const exercisesWithoutMediaMatch: ExerciseWithoutMediaMatch[] = [
  {
    exerciseId: 'ninetyNinetyHipSwitch',
    whyThereIsNoMatch:
      'No seated 90/90 position, and nothing that switches between two hip positions. The seated hip work in the dataset is all static stretching.',
  },
];
