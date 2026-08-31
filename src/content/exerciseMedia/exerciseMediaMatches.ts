import type { ExerciseMediaMatch, ExerciseWithoutMediaMatch } from './exerciseMediaTypes';

/**
 * Which dataset animation belongs to which exercise.
 *
 * **This table was built by looking at the drawings, not by comparing strings.**
 * Every entry below was chosen by opening the dataset's thumbnail for the
 * candidate and checking that the movement in the picture is the movement in
 * the exercise brief. That is why it is committed content rather than something
 * a script recomputes: a fuzzy name match would happily pair "Seated Leg Curl"
 * with "biceps leg concentration curl", and nobody would notice until a gym.
 *
 * The rule for accepting a match is that the animation must not teach anything
 * false. A different grip is a note; a different movement is a rejection, and a
 * rejection goes in `exercisesWithoutMediaMatch` below, where it shows up in the
 * app as "No preview yet" rather than being quietly wrong.
 *
 * Adding a match is three steps: put the row here, run `npm run media:copy`,
 * and commit the `.gif` it writes.
 */
export const exerciseMediaMatches: ExerciseMediaMatch[] = [
  // ---------------------------------------------------------------------------
  // Lower body
  // ---------------------------------------------------------------------------
  {
    exerciseId: 'legExtension',
    datasetExerciseId: '0585',
    datasetExerciseName: 'lever leg extension',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'seatedLegCurl',
    datasetExerciseId: '0599',
    datasetExerciseName: 'lever seated leg curl',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'seatedHipAbduction',
    datasetExerciseId: '0597',
    datasetExerciseName: 'lever seated hip abduction',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'seatedHipAdduction',
    datasetExerciseId: '0598',
    datasetExerciseName: 'lever seated hip adduction',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'gobletSquat',
    datasetExerciseId: '1760',
    datasetExerciseName: 'dumbbell goblet squat',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'gobletSquatToBox',
    datasetExerciseId: '1760',
    datasetExerciseName: 'dumbbell goblet squat',
    matchQuality: 'close',
    differenceFromOurVersion:
      'The same goblet squat without the bench, so it shows the hold but not the depth target. The dataset does have a squat to a bench (0291, "dumbbell bench squat"), but it holds the dumbbells at the sides, which contradicts the cue that matters most here. Sharing the goblet squat drawing was the smaller lie.',
  },
  {
    exerciseId: 'splitSquat',
    datasetExerciseId: '2368',
    datasetExerciseName: 'split squats',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'dumbbellSplitSquat',
    datasetExerciseId: '0410',
    datasetExerciseName: 'dumbbell single leg split squat',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'dumbbellHipThrust',
    datasetExerciseId: '1409',
    datasetExerciseName: 'barbell glute bridge',
    matchQuality: 'close',
    differenceFromOurVersion:
      'Shoulders on the floor rather than against a bench, and a barbell rather than a dumbbell. It is the right hip extension against a load held across the hips, over a shorter range. The dataset has no hip thrust at all.',
  },
  {
    exerciseId: 'dumbbellRomanianDeadlift',
    datasetExerciseId: '1459',
    datasetExerciseName: 'dumbbell romanian deadlift',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'barbellRomanianDeadlift',
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
    datasetExerciseId: '0180',
    datasetExerciseName: 'cable low seated row',
    matchQuality: 'close',
    differenceFromOurVersion:
      'A straight bar rather than the neutral-grip handle. Same machine, same seated position, same pull to the navel.',
  },
  {
    exerciseId: 'latPulldown',
    datasetExerciseId: '0818',
    datasetExerciseName: 'twin handle parallel grip lat pulldown',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'chestSupportedDumbbellRow',
    datasetExerciseId: '1331',
    datasetExerciseName: 'dumbbell reverse grip incline bench two arm row',
    matchQuality: 'close',
    differenceFromOurVersion:
      'An underhand grip rather than a neutral one. The chest support, the incline bench and both dumbbells are right, which is the whole point of the exercise.',
  },
  {
    exerciseId: 'cableFacePull',
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
    datasetExerciseId: '0577',
    datasetExerciseName: 'lever chest press',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'inclineDumbbellPress',
    datasetExerciseId: '0314',
    datasetExerciseName: 'dumbbell incline bench press',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'shoulderPressMachine',
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
    datasetExerciseId: '0979',
    datasetExerciseName: 'band horizontal pallof press',
    matchQuality: 'close',
    differenceFromOurVersion:
      'A band rather than the cable station. The anti-rotation press, the stance and the resistance arriving from the side are all right.',
  },
  {
    exerciseId: 'deadBug',
    datasetExerciseId: '0276',
    datasetExerciseName: 'dead bug',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'farmersCarry',
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
    datasetExerciseId: '3666',
    datasetExerciseName: 'walking on incline treadmill',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'stationaryBikeEasy',
    datasetExerciseId: '0798',
    datasetExerciseName: 'stationary bike walk',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'ellipticalEasy',
    datasetExerciseId: '2141',
    datasetExerciseName: 'walk elliptical cross trainer',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },

  // ---------------------------------------------------------------------------
  // Mobility and warm-up
  // ---------------------------------------------------------------------------
  {
    exerciseId: 'bandPullApart',
    datasetExerciseId: '0993',
    datasetExerciseName: 'band reverse fly',
    matchQuality: 'close',
    differenceFromOurVersion:
      'Filed as a reverse fly, but the drawing is a band held at chest height and pulled apart to arms wide, which is the pull-apart.',
  },
  {
    exerciseId: 'foamRollThoracicSpine',
    datasetExerciseId: '2208',
    datasetExerciseName: 'roller back stretch',
    matchQuality: 'exact',
    differenceFromOurVersion: '',
  },
  {
    exerciseId: 'ankleWallRocks',
    datasetExerciseId: '1407',
    datasetExerciseName: 'calf push stretch with hands against wall',
    matchQuality: 'close',
    differenceFromOurVersion:
      'A held calf stretch rather than a rocking one, but it is the same split stance at the same wall driving the same ankle into dorsiflexion.',
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
    exerciseId: 'rowingMachineEasy',
    whyThereIsNoMatch:
      'The dataset has no rowing ergometer. Its cardio machines are the treadmill, the upright bike, the elliptical, the stepmill, a SkiErg and an arm bike. Nothing rows.',
  },
  {
    exerciseId: 'catCow',
    whyThereIsNoMatch:
      'No quadruped spinal flexion and extension anywhere in the set. The nearest things filed under the spine are a standing pelvic tilt and a seated spine stretch, neither of which is on all fours.',
  },
  {
    exerciseId: 'wallSlides',
    whyThereIsNoMatch:
      'Nothing performed with the back and arms against a wall. The closest shoulder drill is a standing band Y-raise, which loses the wall — and the wall is the exercise.',
  },
  {
    exerciseId: 'chinTucks',
    whyThereIsNoMatch:
      'The dataset has two neck entries and both are side stretches. There is no cervical retraction.',
  },
  {
    exerciseId: 'bodyweightHipHinge',
    whyThereIsNoMatch:
      'Every hinge in the set is loaded — a barbell good morning, a band straight-leg deadlift. The unloaded pattern drill, which is the point of this one, is not there.',
  },
  {
    exerciseId: 'threadTheNeedle',
    whyThereIsNoMatch: 'No thoracic rotation from a quadruped position in the set at all.',
  },
  {
    exerciseId: 'ninetyNinetyHipSwitch',
    whyThereIsNoMatch:
      'No seated 90/90 position, and nothing that switches between two hip positions. The seated hip work in the dataset is all static stretching.',
  },
  {
    exerciseId: 'couchStretch',
    whyThereIsNoMatch:
      'The quad and hip flexor stretches in the set are lying or prone. There is no kneeling stretch with the rear foot elevated, so nothing shows the position this exercise is entirely about.',
  },
  {
    exerciseId: 'doorwayPecStretch',
    whyThereIsNoMatch:
      'The chest stretches are a partner-assisted one, a bar held behind the back, and a dynamic arm swing. None uses a doorway, and the dynamic one would teach a swing where this asks for a hold.',
  },
];
