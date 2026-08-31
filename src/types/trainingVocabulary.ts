/**
 * The shared vocabulary of the training domain.
 *
 * Everything in `src/content/`, `src/domain/` and (from M4) `src/services/` speaks
 * these words. They are declared once, here, so that a typo in an exercise
 * definition is a type error rather than a silently unmatched string.
 *
 * Each union is backed by an `as const` array so the values also exist at
 * runtime. The content integrity tests use those arrays to prove that every
 * exercise and every programme slot references something real.
 */

// ---------------------------------------------------------------------------
// Where a movement sits in the session
// ---------------------------------------------------------------------------

/**
 * The three kinds of movement the app prescribes. They are logged differently:
 * strength work records weight and reps, cardio records duration, mobility
 * records only that it was done.
 */
export const MOVEMENT_CATEGORIES = ['strength', 'cardio', 'mobility'] as const;
export type MovementCategory = (typeof MOVEMENT_CATEGORIES)[number];

/**
 * What the movement trains, in movement terms rather than muscle terms.
 *
 * This is what makes "every session is full body" checkable: a session template
 * can be inspected to confirm it covers a push, a pull, a squat and a hinge.
 * It is also what a future exercise substitution feature would match on.
 */
export const MOVEMENT_PATTERNS = [
  'squat',
  'hinge',
  'lunge',
  'horizontalPush',
  'horizontalPull',
  'verticalPush',
  'verticalPull',
  'carry',
  'antiRotation',
  'antiExtension',
  'isolation',
  'steadyStateCardio',
  'mobility',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

// ---------------------------------------------------------------------------
// Anatomy
// ---------------------------------------------------------------------------

/**
 * Muscle groups at the resolution a beginner needs, not the resolution an
 * anatomist would want. `thoracicSpine` is a region rather than a muscle; it
 * earns its place because several mobility drills target exactly that and
 * nothing else describes them honestly.
 */
export const MUSCLE_GROUPS = [
  'quadriceps',
  'hamstrings',
  'glutes',
  'adductors',
  'calves',
  'hipFlexors',
  'spinalErectors',
  'latissimusDorsi',
  'midBack',
  'upperTraps',
  'rearDeltoids',
  'sideDeltoids',
  'frontDeltoids',
  'chest',
  'biceps',
  'triceps',
  'forearmsAndGrip',
  'abdominals',
  'obliques',
  'deepNeckFlexors',
  'thoracicSpine',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/**
 * The joints and regions that currently hurt. Matches `UserProfile.painAreas`
 * in docs/DATA_MODEL.md exactly — do not let the two drift apart.
 */
export const PAIN_AREAS = ['neck', 'lowerBack', 'shoulders', 'knees', 'hips', 'ankles'] as const;
export type PainArea = (typeof PAIN_AREAS)[number];

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

/**
 * Every piece of equipment the programme is allowed to ask for.
 *
 * `UserProfile.availableEquipmentIds` is a subset of this list, which is how a
 * gym that lacks a hip thrust machine can be handled without editing content.
 */
export const EQUIPMENT_IDS = [
  'bodyweightOnly',
  'legPressMachine',
  'seatedLegCurlMachine',
  'chestPressMachine',
  'latPulldownMachine',
  'seatedCableRowMachine',
  'chestSupportedRowMachine',
  'hipThrustMachine',
  'cableStation',
  'dumbbells',
  'barbell',
  'flatBench',
  'adjustableBench',
  'plyometricBox',
  'landmineAttachment',
  'treadmill',
  'stationaryBike',
  'rowingMachine',
  'exerciseMat',
  'resistanceBand',
  'foamRoller',
  'wall',
] as const;
export type EquipmentId = (typeof EQUIPMENT_IDS)[number];

/**
 * How load is added to a movement. This is the single input that decides the
 * size of a progression step — see docs/TRAINING_PROGRAM.md section 7 and
 * `src/domain/loadIncrements.ts`.
 *
 * `dumbbellPair` and `singleDumbbell` are separate because a prescribed
 * dumbbell weight is always the weight of ONE dumbbell. The pair variant is
 * the only thing that knows two of them are being held, which matters when
 * total session volume is calculated.
 */
export const LOADING_STYLES = [
  'weightStackMachine',
  'cableStack',
  'barbell',
  'dumbbellPair',
  'singleDumbbell',
  'bodyweight',
  'unloaded',
] as const;
export type LoadingStyle = (typeof LOADING_STYLES)[number];

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

/**
 * How a set felt. Asked after every working set, and the sole input to
 * auto-regulation. Matches `PerformedSet.effortRating` in docs/DATA_MODEL.md.
 */
export const EFFORT_RATINGS = ['easy', 'justRight', 'brutal'] as const;
export type EffortRating = (typeof EFFORT_RATINGS)[number];

/** The three sessions the programme cycles through: A, B, C, A, B, C. */
export const SESSION_LETTERS = ['A', 'B', 'C'] as const;
export type SessionLetter = (typeof SESSION_LETTERS)[number];

/**
 * An inclusive rep range. Double progression works by climbing from
 * `minimumReps` to `maximumReps` and only then adding weight, so both ends are
 * load-bearing: the top is the trigger, the bottom is where the next weight starts.
 */
export type RepRange = {
  minimumReps: number;
  maximumReps: number;
};

/**
 * The RPE band a phase is meant to be trained at, where RPE 10 means no further
 * reps were possible. Phase 1 sits at 5-6 on purpose: see
 * docs/TRAINING_PROGRAM.md section 2, principle 4.
 */
export type EffortTargetRange = {
  minimumRatingOfPerceivedExertion: number;
  maximumRatingOfPerceivedExertion: number;
};
