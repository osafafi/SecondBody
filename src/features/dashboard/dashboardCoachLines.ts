import { findCoachLinesByCategory } from '@/content/coachVoice/allCoachLines';
import { selectCoachLine } from '@/domain/coachLineSelection';
import type { DailyCoachMomentInput } from '@/domain/dailyCoachMoment';
import { selectDailyCoachMoment } from '@/domain/dailyCoachMoment';
import type { CoachVerbosityLevel } from '@/types/coachVoiceTypes';

/**
 * The one line Harout says on the Today screen, or none.
 *
 * The ranking — which of six possible situations is the one worth mentioning —
 * is `src/domain/dailyCoachMoment.ts`. The lines themselves are in
 * `src/content/coachVoice/`. This is the thin layer between them, and it is the
 * same shape as `activeSessionCoachLines.ts` for the same reason: a component
 * that writes its own coach copy has broken the voice.
 *
 * **No praise is ever spent here.** Nothing on this screen is an achievement —
 * opening the app is not a thing he made happen — and praise is earned and
 * rationed. See `canSpendPraiseOnLoadDecision` for where it is spent instead.
 */

export type DailyCoachLineInput = DailyCoachMomentInput & {
  configuredVerbosity: CoachVerbosityLevel;

  /**
   * Anything that counts up, so the line rotates across days rather than
   * repeating. The screen passes sessions completed plus days since the last
   * one, which moves even during a week nothing was trained.
   */
  rotationIndex: number;
};

/** The line for today, or null when there is nothing worth saying. */
export function selectDailyCoachLine(input: DailyCoachLineInput): string | null {
  const moment = selectDailyCoachMoment(input);

  if (!moment) {
    return null;
  }

  return (
    selectCoachLine({
      candidateLines: findCoachLinesByCategory(moment),
      configuredVerbosity: input.configuredVerbosity,
      rotationIndex: input.rotationIndex,
      mayUsePraise: false,
    })?.text ?? null
  );
}
