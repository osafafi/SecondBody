import type { CoachingContentFacts } from '@/domain/coachingBundleAssembly';

import { findExerciseById } from '../exercises/allExercises';
import { nightlySleepTargetHours, stepCountTargets } from '../habits/dailyHabitDefinitions';
import { defaultProgramTemplateId, findProgramTemplateById } from '../programs/allProgramTemplates';

/**
 * The facts a coaching bundle needs from this folder, gathered in one place.
 *
 * `src/domain/coachingBundleAssembly.ts` cannot read content — that is the
 * dependency rule — so it takes these as arguments. There are two callers that
 * have to supply them, the download button in Settings and
 * `npm run coach:export`, and gathering them at each caller is how the two
 * quietly end up resolving exercise names differently. So they are gathered
 * here, once, and both callers ask for them.
 *
 * The `CoachingContentFacts` import is type-only. It erases at build time and
 * creates no runtime dependency on `src/domain/` — the same argument the domain
 * README makes for its own type imports.
 */

/**
 * The content facts for a stored programme, or null when this build does not
 * have it.
 *
 * Null is a real answer rather than a fallback to the default programme. An
 * assignment naming a template that is not in the app means stored data and
 * shipped content have gone out of step, and exporting a bundle whose
 * programme section was quietly built from a substituted template would hide
 * that in a file somebody is about to reason from.
 *
 * `null` for `programTemplateId` means no programme has been started. The
 * default template stands in — it is read only for a week count, and the
 * bundle's programme section is null in that case anyway.
 */
export function findCoachingContentFacts(
  programTemplateId: string | null,
): CoachingContentFacts | null {
  const programTemplate = findProgramTemplateById(programTemplateId ?? defaultProgramTemplateId);

  if (programTemplate === null) {
    return null;
  }

  return {
    programTemplate,
    startingDailyStepTarget: stepCountTargets.startingDailyStepTarget,
    finalDailyStepTarget: stepCountTargets.finalDailyStepTarget,
    nightlySleepTargetHours,

    /*
     * The full name rather than `shortDisplayName`. The short one exists so a
     * movement fits on a phone mid-set; a bundle is read on a screen with room,
     * by someone who was not in the gym.
     */
    resolveExerciseName: (exerciseId) => findExerciseById(exerciseId)?.displayName ?? null,
  };
}
