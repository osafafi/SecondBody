import { findCoachLinesByCategory } from '@/content/coachVoice/allCoachLines';
import { shouldSurfaceEarlyScaleReassurance } from '@/domain/bodyWeightExpectations';
import { selectCoachLine } from '@/domain/coachLineSelection';
import type { CoachVerbosityLevel } from '@/types/coachVoiceTypes';

/**
 * The one line Harout says on the Progress screen, or none.
 *
 * Only one moment on this screen belongs to the coach: the first three weeks,
 * when the scale has not moved and that is the plan working rather than the plan
 * failing. Everything else on the screen is a number with a sentence attached,
 * and those sentences live in `progressWording.ts` because they contain values
 * that only exist at runtime.
 *
 * **No praise is spent here.** Looking at a chart is not an achievement. Praise
 * belongs where something was actually made to happen — a load going up, a
 * session finished — and it stops meaning anything if a screen hands it out for
 * being opened.
 */

export type ProgressCoachLineInput = {
  /** Which week of the programme he is on. */
  currentWeekNumber: number;

  configuredVerbosity: CoachVerbosityLevel;

  /** Anything that counts up, so the line rotates rather than repeating. */
  rotationIndex: number;
};

/** The reassurance line about the scale, when it is still true. Null after week 3. */
export function selectEarlyScaleCoachLine(input: ProgressCoachLineInput): string | null {
  if (!shouldSurfaceEarlyScaleReassurance(input.currentWeekNumber)) {
    return null;
  }

  return (
    selectCoachLine({
      candidateLines: findCoachLinesByCategory('earlyScaleReassurance'),
      configuredVerbosity: input.configuredVerbosity,
      rotationIndex: input.rotationIndex,
      mayUsePraise: false,
    })?.text ?? null
  );
}
