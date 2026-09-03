/**
 * How an exercise's animation is sourced.
 *
 * Most of them are not drawn for this app: they come from the open
 * `hasaneyldrm/exercises-dataset` collection, whose 1324 records are matched to
 * this app's 36 exercises by hand — see `exerciseMediaMatches.ts` for the table
 * and `tools/exercise-media/README.md` for how the files get copied in.
 *
 * The rest were generated for this app, for movements the dataset had nothing
 * honest to offer. Which of the two a file is decides who owns it, so every row
 * says which it is rather than leaving it to a default.
 */

/** Where an exercise's animation came from, and therefore who owns it. */
export const EXERCISE_MEDIA_SOURCES = [
  /**
   * Copied byte for byte out of `hasaneyldrm/exercises-dataset`. **Gym Visual's
   * property, not this project's** — see `exerciseMediaAttribution.ts` and
   * docs/EXERCISE_MEDIA_SPEC.md section 2.
   */
  'gymVisualDataset',

  /**
   * Generated for this app, for a movement the dataset did not have. These are
   * this project's own files, so nothing outside it constrains what happens to
   * them.
   */
  'generatedForThisApp',
] as const;

export type ExerciseMediaSource = (typeof EXERCISE_MEDIA_SOURCES)[number];

/** How well a dataset animation actually shows the exercise it is attached to. */
export const EXERCISE_MEDIA_MATCH_QUALITIES = [
  /**
   * The same movement, performed with the same equipment. What the animation
   * shows is what the exercise brief describes.
   */
  'exact',

  /**
   * The same movement pattern, with something visibly different about it —
   * a band where the gym has a cable, a barbell where the programme says
   * dumbbell, a grip that is not the one being cued.
   *
   * `differenceFromOurVersion` says what, in a sentence, and that sentence is
   * the review note for anyone deciding whether to keep the match.
   */
  'close',
] as const;

export type ExerciseMediaMatchQuality = (typeof EXERCISE_MEDIA_MATCH_QUALITIES)[number];

/** One exercise, and the dataset animation that was chosen for it. */
export type ExerciseMediaMatchedFromDataset = {
  /** The app's exercise. Also the name of the copied file, `{exerciseId}.gif`. */
  exerciseId: string;

  mediaSource: 'gymVisualDataset';

  /** The record's id in `data/exercises.json`, e.g. `"0585"`. */
  datasetExerciseId: string;

  /**
   * The record's name, copied verbatim and lower-cased as the dataset writes
   * it. It is here so the match is readable in a diff without anyone opening a
   * 17 MB JSON file, and so the copy tool can prove the id still points at the
   * movement someone actually looked at.
   */
  datasetExerciseName: string;

  matchQuality: ExerciseMediaMatchQuality;

  /** Empty for an exact match. One sentence for a close one. */
  differenceFromOurVersion: string;
};

/** One exercise, and the animation generated for it because the dataset had none. */
export type ExerciseMediaGeneratedForThisApp = {
  /** The app's exercise. Also the name of the file, `{exerciseId}.gif`. */
  exerciseId: string;

  mediaSource: 'generatedForThisApp';

  /**
   * What the frames actually show, in one sentence.
   *
   * A dataset row is reviewable because it names a record someone can go and
   * look at. A generated one has no such record, so this is what a reviewer
   * checks the file against — and what says whether the drawing is the movement
   * the brief describes or merely something in the same position.
   */
  whatTheAnimationShows: string;
};

/** One exercise's animation, whoever it came from. */
export type ExerciseMediaMatch = ExerciseMediaMatchedFromDataset | ExerciseMediaGeneratedForThisApp;

/** One exercise the dataset has nothing usable for. */
export type ExerciseWithoutMediaMatch = {
  exerciseId: string;

  /**
   * Why nothing was chosen. Written for the person who is going to fix it: it
   * says what was searched for and what the nearest miss was, so the search
   * does not have to be done again from scratch.
   */
  whyThereIsNoMatch: string;
};
