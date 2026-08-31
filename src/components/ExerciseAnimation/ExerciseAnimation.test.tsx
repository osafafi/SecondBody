import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { exerciseMediaMatches } from '@/content/exerciseMedia/exerciseMediaMatches';

import { ExerciseAnimation } from './ExerciseAnimation';

/**
 * A real matched exercise and a real unmatched one.
 *
 * Reading them out of the committed table rather than hard-coding two ids means
 * these tests keep testing both branches after somebody resolves one of the
 * gaps. A hard-coded `couchStretch` would start silently testing the matched
 * path the day a GIF is found for it.
 */
const [firstMatch] = exerciseMediaMatches;

if (!firstMatch) {
  throw new Error('The media match table is empty, so there is nothing to render.');
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
        exerciseId="couchStretch"
        displayName="Couch Stretch"
        primaryMuscleGroups={['hipFlexors']}
      />,
    );

    // The accessible name carries the whole story, because a screen reader gets
    // nothing from the icon and nothing from the label beside it.
    const fallback = screen.getByRole('img', {
      name: 'Couch Stretch. No preview available for this movement yet.',
    });

    expect(fallback).toHaveTextContent('No preview yet');
    expect(fallback.querySelector('svg')).not.toBeNull();
  });

  it('does not request a file for an exercise that has none', () => {
    const { container } = render(
      <ExerciseAnimation
        exerciseId="catCow"
        displayName="Cat-Cow"
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
