import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  exerciseMediaMatches,
  exercisesWithoutMediaMatch,
} from '@/content/exerciseMedia/exerciseMediaMatches';

import { ExerciseAnimation } from './ExerciseAnimation';

/**
 * A real exercise with an animation and a real one without.
 *
 * Both are read out of the committed table rather than hard-coded, so these
 * tests keep testing both branches after somebody resolves one of the gaps. A
 * hard-coded `couchStretch` used to stand in for the second one, and it started
 * testing the matched path the day an animation was made for it.
 */
const [firstMatch] = exerciseMediaMatches;
const [firstExerciseWithoutMedia] = exercisesWithoutMediaMatch;

if (!firstMatch) {
  throw new Error('The media match table is empty, so there is nothing to render.');
}

if (!firstExerciseWithoutMedia) {
  throw new Error(
    'Every exercise now has an animation, so the fallback cannot be rendered from real ' +
      'content. Delete these two tests, or the fallback, rather than inventing an id.',
  );
}

describe('ExerciseAnimation', () => {
  it('draws the animation for an exercise that has one', () => {
    render(
      <ExerciseAnimation
        exerciseId={firstMatch.exerciseId}
        displayName="Leg Extension"
        primaryMuscleGroups={['quadriceps']}
      />,
    );

    const animation = screen.getByRole('img', { name: /Leg Extension/ });

    expect(animation).toHaveAttribute('src', `/exercise-media/${firstMatch.exerciseId}.gif`);
  });

  it('says so, in words, when there is no animation yet', () => {
    render(
      <ExerciseAnimation
        exerciseId={firstExerciseWithoutMedia.exerciseId}
        displayName="Movement Without A Preview"
        primaryMuscleGroups={['hipFlexors']}
      />,
    );

    // The accessible name carries the whole story, because a screen reader gets
    // nothing from the icon and nothing from the label beside it.
    const fallback = screen.getByRole('img', {
      name: 'Movement Without A Preview. No preview available for this movement yet.',
    });

    expect(fallback).toHaveTextContent('No preview yet');
    expect(fallback.querySelector('svg')).not.toBeNull();
  });

  it('does not request a file for an exercise that has none', () => {
    const { container } = render(
      <ExerciseAnimation
        exerciseId={firstExerciseWithoutMedia.exerciseId}
        displayName="Movement Without A Preview"
        primaryMuscleGroups={['thoracicSpine']}
      />,
    );

    // The committed table is what decides, so a missing preview costs no
    // request at all — not even one that 404s.
    expect(container.querySelector('img')).toBeNull();
  });

  it('passes an unknown exercise id through to the fallback rather than a broken image', () => {
    render(
      <ExerciseAnimation
        exerciseId="somethingStoredAgainstAnExerciseThatNoLongerExists"
        displayName="Unknown Movement"
        primaryMuscleGroups={['abdominals']}
      />,
    );

    expect(screen.getByRole('img', { name: /No preview available/ })).toBeInTheDocument();
  });
});
