import type {
  EquipmentId,
  LoadingStyle,
  MovementCategory,
  MovementPattern,
  MuscleGroup,
  PainArea,
} from './trainingVocabulary';

/**
 * The brief the exercise animation generator works from.
 *
 * M3 turns each of these into an animated SVG by combining it with
 * docs/EXERCISE_MEDIA_SPEC.md and the committed exemplar file. It lives on the
 * exercise definition rather than in the generator so that a wrong animation is
 * fixed by correcting the description of the movement, in the same file that
 * describes the movement to the user.
 */
export type ExerciseMediaBrief = {
  /** Where the body and the equipment start. One sentence, present tense. */
  startPosition: string;

  /** Where they are at the finish of the rep. One sentence, present tense. */
  endPosition: string;

  /** What has to be drawn besides the figure: the machine, the bench, the bar. */
  equipmentToDraw: string;
};

/**
 * One exercise, described once and referenced everywhere by `exerciseId`.
 *
 * Programme templates, warm-ups, mobility routines and logged sessions all hold
 * ids rather than copies, so correcting a form cue corrects it everywhere, and
 * an exercise's history survives the programme it was first prescribed in.
 */
export type ExerciseDefinition = {
  /**
   * Stable camelCase identifier. It is also the media filename
   * (`public/exercise-media/{exerciseId}.svg`), so it must stay camelCase and
   * must never change once sessions have been logged against it.
   */
  exerciseId: string;

  /** Full name, as it would be said out loud. Shown on the exercise brief screen. */
  displayName: string;

  /** Shortened name for tight rows and the session overview. */
  shortDisplayName: string;

  movementCategory: MovementCategory;
  movementPattern: MovementPattern;

  /** What the exercise is actually for. At least one. */
  primaryMuscleGroups: MuscleGroup[];

  /** What else it works. May be empty. */
  secondaryMuscleGroups: MuscleGroup[];

  /** Everything needed to perform it. Checked against the user's gym in M4. */
  requiredEquipmentIds: EquipmentId[];

  /** Decides the size of a progression step. See `src/domain/loadIncrements.ts`. */
  loadingStyle: LoadingStyle;

  /**
   * Form cues, shown on every set rather than only the first.
   *
   * Omar is effectively a beginner and asked for full cues throughout, so these
   * are written to be read mid-set with a weight in hand: short, imperative, and
   * ordered from setup to finish.
   */
  formCues: string[];

  /** The specific ways this movement goes wrong, and what it feels like when it does. */
  commonMistakes: string[];

  /**
   * Why this exercise is in this programme, for this person. Shown once, when the
   * exercise is first met. Explaining the reason is what stops it being skipped.
   */
  whyItIsInTheProgramme: string;

  /** Pain areas this movement is expected to help, over weeks rather than days. */
  painAreasItHelps: PainArea[];

  /**
   * Pain areas worth attention while doing it. Not a warning against the
   * movement — every exercise here was chosen as joint-friendly — but the list
   * the app consults when a set is marked as having caused sharp pain.
   */
  painAreasToMonitor: PainArea[];

  /**
   * Equivalent movements, best first. Nothing consumes this yet; it exists
   * because "someone is on the leg extension" is the most common reason a session
   * goes off-plan, and the answer belongs next to the exercise.
   */
  substituteExerciseIds: string[];

  mediaBrief: ExerciseMediaBrief;
};
