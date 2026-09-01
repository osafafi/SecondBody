import { describe, expect, it } from 'vitest';

import { allExercises } from '../exercises/allExercises';
import { defaultProgramTemplateId } from '../programs/allProgramTemplates';
import { findCoachingContentFacts } from './coachingContentFacts';

describe('gathering what a coaching bundle needs from content', () => {
  it('finds the programme that was started', () => {
    const contentFacts = findCoachingContentFacts(defaultProgramTemplateId);

    expect(contentFacts?.programTemplate.programTemplateId).toBe(defaultProgramTemplateId);
  });

  it('stands in the default programme when none has been started', () => {
    const contentFacts = findCoachingContentFacts(null);

    expect(contentFacts?.programTemplate.programTemplateId).toBe(defaultProgramTemplateId);
  });

  /*
   * Null rather than a fallback. An assignment naming a template this build
   * does not have means stored data and shipped content have gone out of step,
   * and a bundle built from a substituted programme would hide that inside a
   * file somebody is about to reason from.
   */
  it('refuses a programme this build does not have', () => {
    expect(findCoachingContentFacts('someProgrammeFromTheFuture')).toBeNull();
  });

  it('carries the two ends of the step ramp and the sleep target', () => {
    const contentFacts = findCoachingContentFacts(null);

    expect(contentFacts?.startingDailyStepTarget).toBe(5000);
    expect(contentFacts?.finalDailyStepTarget).toBe(9000);
    expect(contentFacts?.nightlySleepTargetHours).toBe(7);
  });

  it('resolves an exercise to its full name, not its short one', () => {
    const [firstExercise] = allExercises;
    const contentFacts = findCoachingContentFacts(null);

    expect(firstExercise).toBeDefined();
    expect(contentFacts?.resolveExerciseName(firstExercise?.exerciseId ?? '')).toBe(
      firstExercise?.displayName,
    );
  });

  it('returns null for an exercise content no longer has', () => {
    const contentFacts = findCoachingContentFacts(null);

    expect(contentFacts?.resolveExerciseName('somethingRenamedInAPatchRelease')).toBeNull();
  });
});
