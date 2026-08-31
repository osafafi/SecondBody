import type { LoadingStyle } from '@/types/trainingVocabulary';

/**
 * How much weight one step up is, and how to land on a weight that actually
 * exists in a gym.
 *
 * "40 kg minus ten percent" is 36 kg, and there is no 36 kg on a weight stack.
 * Everything in here exists so that the number on the screen is a number he can
 * physically select. See docs/TRAINING_PROGRAM.md section 7.
 */

/**
 * The smallest step up for each way of loading a movement.
 *
 * Dumbbells step by 2 kg because that is the next dumbbell up, and a prescribed
 * dumbbell weight always means the weight of ONE dumbbell. Bodyweight
 * progression is not measured in kilograms at all — it adds reps first — so its
 * increment is zero and `calculateNextPrescribedRepRange` handles it instead.
 */
export const LOAD_INCREMENT_KILOGRAMS_BY_LOADING_STYLE: Record<LoadingStyle, number> = {
  weightStackMachine: 2.5,
  cableStack: 2.5,
  barbell: 2.5,
  dumbbellPair: 2,
  singleDumbbell: 2,
  bodyweight: 0,
  unloaded: 0,
};

/** The smallest amount of weight that can be added to this kind of movement. */
export function resolveSmallestLoadIncrementKilograms(loadingStyle: LoadingStyle): number {
  return LOAD_INCREMENT_KILOGRAMS_BY_LOADING_STYLE[loadingStyle];
}

/** True when this kind of movement is progressed with weight rather than reps. */
export function isLoadableLoadingStyle(loadingStyle: LoadingStyle): boolean {
  return resolveSmallestLoadIncrementKilograms(loadingStyle) > 0;
}

/**
 * Kills the floating point noise that 0.1 + 0.2 style arithmetic leaves behind.
 * Two decimal places is far finer than any gym equipment, so this only ever
 * removes error.
 */
function roundToTwoDecimalPlaces(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Rounds a weight to the nearest value that can actually be selected, never
 * going below a single increment.
 *
 * Unloadable styles (bodyweight, unloaded) always come back as 0.
 */
export function roundWeightToNearestLoadableValue(
  weightKilograms: number,
  loadingStyle: LoadingStyle,
): number {
  const incrementKilograms = resolveSmallestLoadIncrementKilograms(loadingStyle);

  if (incrementKilograms === 0) {
    return 0;
  }

  const roundedKilograms = Math.round(weightKilograms / incrementKilograms) * incrementKilograms;

  return roundToTwoDecimalPlaces(Math.max(roundedKilograms, incrementKilograms));
}

/**
 * Rounds a weight DOWN to a value that can be selected, never below a single
 * increment.
 *
 * Every reduction in the app goes through this rather than through
 * `roundWeightToNearestLoadableValue`, because rounding a safety reduction back
 * up is exactly the wrong direction to be wrong in: 40 kg minus twenty percent
 * is 32 kg, and the nearest selectable weight is 32.5 — heavier than the
 * reduction asked for. This returns 30.
 */
export function roundWeightDownToLoadableValue(
  weightKilograms: number,
  loadingStyle: LoadingStyle,
): number {
  const incrementKilograms = resolveSmallestLoadIncrementKilograms(loadingStyle);

  if (incrementKilograms === 0) {
    return 0;
  }

  const roundedKilograms = Math.floor(weightKilograms / incrementKilograms) * incrementKilograms;

  return roundToTwoDecimalPlaces(Math.max(roundedKilograms, incrementKilograms));
}

/**
 * The total weight actually being moved, which is not always the weight on the
 * screen.
 *
 * A dumbbell press prescribed at 8 kg is 8 kg in each hand — 16 kg of work. The
 * screen shows 8 because that is the number written on the dumbbell he picks up,
 * and volume charts need the other one.
 */
export function calculateEffectiveLoadKilograms(
  prescribedWeightKilograms: number,
  loadingStyle: LoadingStyle,
): number {
  const implementCount = loadingStyle === 'dumbbellPair' ? 2 : 1;

  return roundToTwoDecimalPlaces(prescribedWeightKilograms * implementCount);
}
