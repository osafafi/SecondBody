import { describe, expect, it } from 'vitest';

import {
  findOnboardingStepProblems,
  isOnboardingDraftComplete,
  MAXIMUM_PLAUSIBLE_AGE_YEARS,
  MINIMUM_TRAINING_AGE_YEARS,
  type OnboardingDraft,
} from './onboardingValidation';

/** The year every test below reasons about, passed in rather than read. */
const CURRENT_YEAR = 2026;

function buildDraft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return {
    displayName: 'Omar',
    birthYear: 1990,
    heightCentimetres: 178,
    startingWeightKilograms: 92,
    targetWeightKilograms: 83,
    painAreas: ['lowerBack'],
    availableEquipmentIds: ['dumbbells'],
    trainingDaysOfWeek: [1, 3, 5],
    ...overrides,
  };
}

describe('the "about you" step', () => {
  it('accepts a complete answer', () => {
    expect(findOnboardingStepProblems('aboutYou', buildDraft(), CURRENT_YEAR)).toEqual([]);
  });

  it('rejects a blank or whitespace-only name', () => {
    expect(
      findOnboardingStepProblems('aboutYou', buildDraft({ displayName: '' }), CURRENT_YEAR),
    ).toContain('Your name cannot be blank.');

    expect(
      findOnboardingStepProblems('aboutYou', buildDraft({ displayName: '   ' }), CURRENT_YEAR),
    ).toHaveLength(1);
  });

  it('rejects an unanswered number rather than reading it as zero', () => {
    const problems = findOnboardingStepProblems(
      'aboutYou',
      buildDraft({ birthYear: null, heightCentimetres: null }),
      CURRENT_YEAR,
    );

    expect(problems).toHaveLength(2);
  });

  it('reports every problem at once instead of one at a time', () => {
    const problems = findOnboardingStepProblems(
      'aboutYou',
      buildDraft({ displayName: '', birthYear: null, heightCentimetres: null }),
      CURRENT_YEAR,
    );

    expect(problems).toHaveLength(3);
  });

  it('bounds the birth year against the year it is given, not a hard-coded one', () => {
    const justOldEnough = CURRENT_YEAR - MINIMUM_TRAINING_AGE_YEARS;
    const justYoungEnough = CURRENT_YEAR - MAXIMUM_PLAUSIBLE_AGE_YEARS;

    expect(
      findOnboardingStepProblems(
        'aboutYou',
        buildDraft({ birthYear: justOldEnough }),
        CURRENT_YEAR,
      ),
    ).toEqual([]);
    expect(
      findOnboardingStepProblems(
        'aboutYou',
        buildDraft({ birthYear: justYoungEnough }),
        CURRENT_YEAR,
      ),
    ).toEqual([]);

    expect(
      findOnboardingStepProblems(
        'aboutYou',
        buildDraft({ birthYear: justOldEnough + 1 }),
        CURRENT_YEAR,
      ),
    ).toHaveLength(1);
    expect(
      findOnboardingStepProblems(
        'aboutYou',
        buildDraft({ birthYear: justYoungEnough - 1 }),
        CURRENT_YEAR,
      ),
    ).toHaveLength(1);
  });

  it('moves the birth-year window when the year moves', () => {
    const draftBornIn2013 = buildDraft({ birthYear: 2013 });

    // Thirteen in 2026, so old enough. Twelve in 2025, so not yet.
    expect(findOnboardingStepProblems('aboutYou', draftBornIn2013, 2026)).toEqual([]);
    expect(findOnboardingStepProblems('aboutYou', draftBornIn2013, 2025)).toHaveLength(1);
  });

  /* The whole point of the bounds: a height typed into the wrong box. */
  it('catches a height that is really a weight', () => {
    expect(
      findOnboardingStepProblems('aboutYou', buildDraft({ heightCentimetres: 92 }), CURRENT_YEAR),
    ).toHaveLength(1);
  });
});

describe('the "starting point" step', () => {
  it('accepts a complete answer', () => {
    expect(findOnboardingStepProblems('startingPoint', buildDraft(), CURRENT_YEAR)).toEqual([]);
  });

  it('catches a slipped decimal point', () => {
    expect(
      findOnboardingStepProblems(
        'startingPoint',
        buildDraft({ targetWeightKilograms: 8.3 }),
        CURRENT_YEAR,
      ),
    ).toHaveLength(1);
  });

  /*
   * Recomposition can mean the scale going up, down or nowhere. Insisting the
   * target be lower would be the app assuming a goal nobody gave it.
   */
  it('allows a target above the current weight', () => {
    expect(
      findOnboardingStepProblems(
        'startingPoint',
        buildDraft({ startingWeightKilograms: 70, targetWeightKilograms: 78 }),
        CURRENT_YEAR,
      ),
    ).toEqual([]);
  });

  it('allows a target equal to the current weight', () => {
    expect(
      findOnboardingStepProblems(
        'startingPoint',
        buildDraft({ startingWeightKilograms: 84, targetWeightKilograms: 84 }),
        CURRENT_YEAR,
      ),
    ).toEqual([]);
  });
});

describe('the pain areas step', () => {
  /* Having nothing that hurts is the answer everyone hopes to give. */
  it('accepts an empty list', () => {
    expect(
      findOnboardingStepProblems('painAreas', buildDraft({ painAreas: [] }), CURRENT_YEAR),
    ).toEqual([]);
  });
});

describe('the equipment step', () => {
  it('accepts a single piece of equipment', () => {
    expect(
      findOnboardingStepProblems(
        'equipment',
        buildDraft({ availableEquipmentIds: ['bodyweightOnly'] }),
        CURRENT_YEAR,
      ),
    ).toEqual([]);
  });

  it('rejects an empty gym, which would leave nothing to prescribe', () => {
    expect(
      findOnboardingStepProblems(
        'equipment',
        buildDraft({ availableEquipmentIds: [] }),
        CURRENT_YEAR,
      ),
    ).toHaveLength(1);
  });
});

describe('the schedule step', () => {
  it('accepts one day a week', () => {
    expect(
      findOnboardingStepProblems('schedule', buildDraft({ trainingDaysOfWeek: [3] }), CURRENT_YEAR),
    ).toEqual([]);
  });

  it('accepts every day of the week, Sunday included', () => {
    expect(
      findOnboardingStepProblems(
        'schedule',
        buildDraft({ trainingDaysOfWeek: [0, 1, 2, 3, 4, 5, 6] }),
        CURRENT_YEAR,
      ),
    ).toEqual([]);
  });

  it('rejects training on no days at all', () => {
    expect(
      findOnboardingStepProblems('schedule', buildDraft({ trainingDaysOfWeek: [] }), CURRENT_YEAR),
    ).toHaveLength(1);
  });

  it('rejects a day that is not a day of the week', () => {
    expect(
      findOnboardingStepProblems(
        'schedule',
        buildDraft({ trainingDaysOfWeek: [1, 7] }),
        CURRENT_YEAR,
      ),
    ).toContain('Training days must be days of the week.');
  });
});

describe('deciding the draft is finished', () => {
  it('accepts a draft where every step passes', () => {
    expect(isOnboardingDraftComplete(buildDraft(), CURRENT_YEAR)).toBe(true);
  });

  it('accepts a draft with no pain areas', () => {
    expect(isOnboardingDraftComplete(buildDraft({ painAreas: [] }), CURRENT_YEAR)).toBe(true);
  });

  it('refuses a draft with a problem on any single step', () => {
    expect(isOnboardingDraftComplete(buildDraft({ displayName: '' }), CURRENT_YEAR)).toBe(false);
    expect(isOnboardingDraftComplete(buildDraft({ birthYear: null }), CURRENT_YEAR)).toBe(false);
    expect(
      isOnboardingDraftComplete(buildDraft({ startingWeightKilograms: null }), CURRENT_YEAR),
    ).toBe(false);
    expect(isOnboardingDraftComplete(buildDraft({ availableEquipmentIds: [] }), CURRENT_YEAR)).toBe(
      false,
    );
    expect(isOnboardingDraftComplete(buildDraft({ trainingDaysOfWeek: [] }), CURRENT_YEAR)).toBe(
      false,
    );
  });
});
