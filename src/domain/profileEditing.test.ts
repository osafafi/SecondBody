import { describe, expect, it } from 'vitest';

import type { UserProfile } from '@/types/userAccountTypes';

import {
  applyProfileEdits,
  findProfileEditProblems,
  hasProfileEdits,
  readEditableProfileFields,
  type EditableProfileFields,
} from './profileEditing';

function buildUserProfile(changes: Partial<UserProfile> = {}): UserProfile {
  return {
    displayName: 'Omar',
    birthYear: 1990,
    heightCentimetres: 178,
    startingWeightKilograms: 92,
    targetWeightKilograms: 82,
    painAreas: ['lowerBack'],
    excludedExerciseIds: ['barbellBackSquat'],
    unavailableExerciseIds: [],
    availableEquipmentIds: ['barbell', 'dumbbells'],
    trainingDaysOfWeek: [1, 3, 5],
    hasCompletedOnboarding: true,
    createdAt: new Date('2026-06-01T09:00:00Z'),
    updatedAt: new Date('2026-08-01T09:00:00Z'),
    ...changes,
  };
}

function buildEdits(changes: Partial<EditableProfileFields> = {}): EditableProfileFields {
  return { ...readEditableProfileFields(buildUserProfile()), ...changes };
}

describe('opening the form', () => {
  it('starts from what is stored', () => {
    const edits = readEditableProfileFields(buildUserProfile());

    expect(edits).toEqual({
      displayName: 'Omar',
      heightCentimetres: 178,
      targetWeightKilograms: 82,
      trainingDaysOfWeek: [1, 3, 5],
      painAreas: ['lowerBack'],
    });
  });

  /*
   * Copied rather than aliased. Editing the form must not mutate the profile
   * held in context, or cancelling would leave the app showing changes nobody
   * saved.
   */
  it('copies the lists rather than sharing them with the profile', () => {
    const profile = buildUserProfile();
    const edits = readEditableProfileFields(profile);

    edits.trainingDaysOfWeek.push(6);
    edits.painAreas.push('knees');

    expect(profile.trainingDaysOfWeek).toEqual([1, 3, 5]);
    expect(profile.painAreas).toEqual(['lowerBack']);
  });
});

describe('what is wrong with an edit', () => {
  it('accepts an untouched profile', () => {
    expect(findProfileEditProblems(buildEdits())).toEqual([]);
  });

  it('refuses a blank name', () => {
    expect(findProfileEditProblems(buildEdits({ displayName: '   ' }))).toContain(
      'Your name cannot be blank.',
    );
  });

  it('refuses a height that is really a weight', () => {
    const problems = findProfileEditProblems(buildEdits({ heightCentimetres: 82 }));

    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^Height should be between/);
  });

  it('refuses a cleared field rather than reading it as zero', () => {
    expect(findProfileEditProblems(buildEdits({ targetWeightKilograms: null }))).toHaveLength(1);
  });

  /*
   * The same rule as onboarding, for the same reason: recomposition can mean
   * the scale going up, down or nowhere, and insisting the target be lower
   * would be the app assuming a goal it was not told about.
   */
  it('accepts a target above the starting weight', () => {
    expect(findProfileEditProblems(buildEdits({ targetWeightKilograms: 96 }))).toEqual([]);
  });

  it('refuses training every day of no days', () => {
    expect(findProfileEditProblems(buildEdits({ trainingDaysOfWeek: [] }))).toContain(
      'Pick at least one training day.',
    );
  });

  it('reports every problem at once', () => {
    const problems = findProfileEditProblems(
      buildEdits({ displayName: '', heightCentimetres: null, trainingDaysOfWeek: [] }),
    );

    expect(problems).toHaveLength(3);
  });

  /*
   * The excluded exercises and the equipment list are not on this form. A
   * stored value the form cannot reach must never produce a complaint, because
   * there would be nothing on screen to act on.
   */
  it('says nothing about fields the form cannot change', () => {
    const edits = readEditableProfileFields(buildUserProfile({ availableEquipmentIds: [] }));

    expect(findProfileEditProblems(edits)).toEqual([]);
  });
});

describe('whether anything actually changed', () => {
  const profile = buildUserProfile();

  it('sees no change in an untouched form', () => {
    expect(hasProfileEdits(profile, buildEdits())).toBe(false);
  });

  it('ignores whitespace typed around the name', () => {
    expect(hasProfileEdits(profile, buildEdits({ displayName: '  Omar  ' }))).toBe(false);
  });

  it('ignores the order the days were ticked in', () => {
    expect(hasProfileEdits(profile, buildEdits({ trainingDaysOfWeek: [5, 1, 3] }))).toBe(false);
  });

  it('sees a day added', () => {
    expect(hasProfileEdits(profile, buildEdits({ trainingDaysOfWeek: [1, 3, 5, 6] }))).toBe(true);
  });

  it('sees a day swapped for another', () => {
    expect(hasProfileEdits(profile, buildEdits({ trainingDaysOfWeek: [1, 3, 4] }))).toBe(true);
  });

  it('sees a pain area cleared', () => {
    expect(hasProfileEdits(profile, buildEdits({ painAreas: [] }))).toBe(true);
  });

  it('sees a number changed', () => {
    expect(hasProfileEdits(profile, buildEdits({ targetWeightKilograms: 80 }))).toBe(true);
  });
});

describe('the profile that gets written', () => {
  it('folds the edits in and carries everything else through', () => {
    const profile = buildUserProfile();

    const written = applyProfileEdits(
      profile,
      buildEdits({
        displayName: '  Omar S  ',
        heightCentimetres: 179,
        targetWeightKilograms: 80,
        trainingDaysOfWeek: [5, 1, 2],
        painAreas: ['knees'],
      }),
    );

    expect(written).toEqual({
      displayName: 'Omar S',
      birthYear: 1990,
      heightCentimetres: 179,
      startingWeightKilograms: 92,
      targetWeightKilograms: 80,
      painAreas: ['knees'],
      excludedExerciseIds: ['barbellBackSquat'],
      unavailableExerciseIds: [],
      availableEquipmentIds: ['barbell', 'dumbbells'],
      trainingDaysOfWeek: [1, 2, 5],
      hasCompletedOnboarding: true,
    });
  });

  /*
   * The baseline every past weigh-in is measured against. If this were ever
   * editable, the weight trend would quietly change meaning.
   */
  it('never moves the starting weight', () => {
    const written = applyProfileEdits(
      buildUserProfile({ startingWeightKilograms: 92 }),
      buildEdits({ targetWeightKilograms: 75 }),
    );

    expect(written.startingWeightKilograms).toBe(92);
  });

  it('refuses to write an unanswered field rather than storing a zero', () => {
    expect(() =>
      applyProfileEdits(buildUserProfile(), buildEdits({ heightCentimetres: null })),
    ).toThrow(/before every field was answered/);
  });
});
