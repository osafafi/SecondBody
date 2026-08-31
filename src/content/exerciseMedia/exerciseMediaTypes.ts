/**
 * How an exercise's animation is sourced.
 *
 * The animations are not drawn for this app. They come from the open
 * `hasaneyldrm/exercises-dataset` collection, whose 1324 records are matched to
 * this app's 36 exercises by hand — see `exerciseMediaMatches.ts` for the table
 * and `tools/exercise-media/README.md` for how the files get copied in.
 */

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
export type ExerciseMediaMatch = {
  /** The app's exercise. Also the name of the copied file, `{exerciseId}.gif`. */
  exerciseId: string;

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
