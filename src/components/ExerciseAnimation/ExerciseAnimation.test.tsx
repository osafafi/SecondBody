import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExerciseAnimation } from './ExerciseAnimation';

const seatedCableRowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-labelledby="exerciseMediaTitle">
  <title id="exerciseMediaTitle">Low Row, Neutral Grip</title>
  <desc>A person seated at a low cable row drawing the handle to the navel.</desc>
  <style>.torso { transform: rotate(6deg); }</style>
  <g class="torso"><rect fill="var(--muscle-body-fill, #1C1934)" /></g>
</svg>`;

function respondWith(bodyByUrl: Record<string, string | null>) {
  return vi.fn((url: string) => {
    const body = bodyByUrl[url];

    return Promise.resolve({
      ok: body !== undefined && body !== null,
      text: () => Promise.resolve(body ?? '<!doctype html><html></html>'),
    } as Response);
  });
}

/**
 * Waits for the component to draw, and returns the shadow root it drew into.
 *
 * Asserting on the root itself rather than on something inside it matters: an
 * optional chain through a root that is not there yet yields `undefined`, which
 * would satisfy a `not.toBeNull()` and let the test pass before the fetch had
 * even resolved.
 */
async function waitForAnimationShadowRoot(container: HTMLElement) {
  const shadowHost = container.querySelector('div');

  await waitFor(() => {
    expect(shadowHost?.shadowRoot).toBeTruthy();
  });

  const shadowRoot = shadowHost?.shadowRoot;

  if (!shadowRoot) {
    throw new Error('The animation never attached a shadow root.');
  }

  return shadowRoot;
}

describe('ExerciseAnimation', () => {
  beforeEach(() => {
    // The module caches by exercise id across mounts, so each test uses its own
    // ids rather than reaching in to clear a private map.
    vi.stubGlobal('fetch', respondWith({}));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('inlines the animation so it inherits the palette', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith({ '/exercise-media/seatedCableRow.svg': seatedCableRowSvg }),
    );

    const { container } = render(
      <ExerciseAnimation
        exerciseId="seatedCableRow"
        displayName="Low Row, Neutral Grip"
        primaryMuscleGroups={['midBack']}
      />,
    );

    const shadowRoot = await waitForAnimationShadowRoot(container);

    expect(shadowRoot.querySelector('svg')).not.toBeNull();
    expect(shadowRoot.querySelector('title')?.textContent).toBe('Low Row, Neutral Grip');
    expect(shadowRoot.querySelector('rect')?.getAttribute('fill')).toBe(
      'var(--muscle-body-fill, #1C1934)',
    );
  });

  it('keeps each animation styles and ids to itself', async () => {
    vi.stubGlobal(
      'fetch',
      respondWith({
        '/exercise-media/latPulldown.svg': seatedCableRowSvg,
      }),
    );

    const { container } = render(
      <ExerciseAnimation
        exerciseId="latPulldown"
        displayName="Lat Pulldown"
        primaryMuscleGroups={['latissimusDorsi']}
      />,
    );

    const shadowRoot = await waitForAnimationShadowRoot(container);

    expect(shadowRoot.querySelector('#exerciseMediaTitle')).not.toBeNull();

    // Two animations on one screen would otherwise share a `.torso` rule and a
    // duplicated element id. Neither escapes the shadow boundary.
    expect(document.querySelector('#exerciseMediaTitle')).toBeNull();
    expect(container.querySelector('style')).toBeNull();
  });

  it('falls back to the muscle group icon when there is no animation yet', async () => {
    vi.stubGlobal('fetch', respondWith({}));

    render(
      <ExerciseAnimation
        exerciseId="couchStretch"
        displayName="Couch Stretch"
        primaryMuscleGroups={['hipFlexors']}
      />,
    );

    const fallback = await screen.findByRole('img', { name: /Couch Stretch/ });

    expect(fallback).toBeInTheDocument();
    expect(fallback.querySelector('svg')).not.toBeNull();
  });

  it('does not mistake a dev server index.html for a drawing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<!doctype html><html><body>app shell</body></html>'),
        } as Response),
      ),
    );

    render(
      <ExerciseAnimation
        exerciseId="threadTheNeedle"
        displayName="Thread the Needle"
        primaryMuscleGroups={['thoracicSpine']}
      />,
    );

    expect(await screen.findByRole('img', { name: /Thread the Needle/ })).toBeInTheDocument();
  });

  it('fetches a given exercise once however many times it is shown', async () => {
    const fetchSpy = respondWith({ '/exercise-media/deadBug.svg': seatedCableRowSvg });
    vi.stubGlobal('fetch', fetchSpy);

    const properties = {
      exerciseId: 'deadBug',
      displayName: 'Dead Bug',
      primaryMuscleGroups: ['abdominals'],
    } as const;

    const { container } = render(
      <>
        <ExerciseAnimation {...properties} />
        <ExerciseAnimation {...properties} />
      </>,
    );

    const shadowRoot = await waitForAnimationShadowRoot(container);

    expect(shadowRoot.querySelector('svg')).not.toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
