import type { CoachLineCategory } from '@/types/coachVoiceTypes';

import { shouldSurfaceEarlyScaleReassurance } from './bodyWeightExpectations';
import type { DailyTrainingStance } from './dailyTrainingStatus';

/**
 * Which one thing, if any, Harout says on the Today screen.
 *
 * **One line, or none.** Six situations can be true of the same morning — a
 * fortnight away, a missed Wednesday, a new phase, a deload week, week two of
 * the programme, and a rest day — and a screen that said all six would be a
 * screen he stops reading. So they are ranked, the winner is said, and the rest
 * wait for a day they are the most important thing.
 *
 * The ranking is by how much the situation changes what he is about to do:
 *
 * 1. **Coming back from a layoff** changes the weights on the bar.
 * 2. **A missed session** is the thing he is most likely to be wondering about,
 *    and the line's job is to say it costs nothing — a missed session is a fact
 *    to work around, never a moral event.
 * 3. **A deload week** is going to feel like a wasted week, and saying so first
 *    is the only way that lands.
 * 4. **A new phase** changes what the session contains.
 * 5. **The scale in weeks 1-3** is the single most common reason a beginner
 *    quits, per docs/TRAINING_PROGRAM.md section 11, so it goes unprompted.
 * 6. **A rest day** gets the mobility routine, which is the day's actual work.
 *
 * Returning null is a real answer and the common one. Silence is part of the
 * voice — see `coachLineSelection.ts`.
 */

export type DailyCoachMomentInput = {
  stance: DailyTrainingStance;

  /** Ten days or more since the last session, from `determineLayoffAdjustment`. */
  isReturningFromLayoff: boolean;

  /** A planned training day went by with nothing against it, recently. */
  hasMissedAPlannedSession: boolean;

  /** The week the next session belongs to is the deload week. */
  isDeloadWeekDue: boolean;

  /** The next session is session A of the first week of a phase. */
  isFirstSessionOfPhaseDue: boolean;

  /** The week the next session belongs to. Drives the scale reassurance window. */
  currentWeekNumber: number;
};

/**
 * The moment worth a word today, or null.
 *
 * A finished programme says nothing: there is no line written for it, and
 * inventing one here would put coach copy outside `src/content/coachVoice/`,
 * which CLAUDE.md section 7 does not allow.
 */
export function selectDailyCoachMoment(input: DailyCoachMomentInput): CoachLineCategory | null {
  const {
    stance,
    isReturningFromLayoff,
    hasMissedAPlannedSession,
    isDeloadWeekDue,
    isFirstSessionOfPhaseDue,
    currentWeekNumber,
  } = input;

  /*
   * Mid-session, the screen is a way back into the session and nothing else.
   * The session player does its own talking, and it has far better context for
   * it than this does.
   */
  if (stance === 'sessionInProgress' || stance === 'programmeFinished') {
    return null;
  }

  if (isReturningFromLayoff) {
    return 'returningFromLayoff';
  }

  if (hasMissedAPlannedSession) {
    return 'sessionMissed';
  }

  if (isDeloadWeekDue) {
    return 'deloadWeekOpening';
  }

  if (isFirstSessionOfPhaseDue) {
    return 'phaseOpening';
  }

  if (shouldSurfaceEarlyScaleReassurance(currentWeekNumber)) {
    return 'earlyScaleReassurance';
  }

  /*
   * Only on a day with no gym work in it. On a training day the mobility routine
   * is still worth doing, but it is not the headline, and Harout offering a
   * stretch on the way into a squat session reads as a coach who is not paying
   * attention.
   */
  if (stance === 'restDay') {
    return 'mobilityRoutineOpening';
  }

  return null;
}
