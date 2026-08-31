import { createElement, useEffect, useRef, useState } from 'react';

import { findIconForMuscleGroups } from '@/components/icons/muscleGroupIcons';
import type { MuscleGroup } from '@/types/trainingVocabulary';

import styles from './ExerciseAnimation.module.css';

export type ExerciseAnimationProps = {
  /** The exercise's id, which is also its file name. */
  exerciseId: string;

  /** Used to describe the fallback icon when there is no animation to show. */
  displayName: string;

  /** Decides which icon stands in for a missing animation. */
  primaryMuscleGroups: readonly MuscleGroup[];

  className?: string;
};

/**
 * What the last finished fetch returned, and which exercise it was for.
 *
 * Keeping the id in the state rather than resetting to "loading" when the prop
 * changes means there is no moment where a stale drawing is shown under a new
 * exercise's name: anything whose id does not match the current prop simply is
 * not this exercise's answer yet.
 */
type FetchResult = { exerciseId: string; svgSource: string | null };

/**
 * Animations already fetched, keyed by exercise id.
 *
 * A session shows the same exercise on the brief, on every set and on the
 * summary. The browser's own cache would cover that, but holding the promise
 * means the second and third mounts do not even wait a tick.
 *
 * A missing file is cached as null. If it were retried on every mount, an
 * exercise with no animation yet would fire a losing request every time it
 * appeared.
 */
const svgSourceCache = new Map<string, Promise<string | null>>();

function buildMediaUrl(exerciseId: string): string {
  return `${import.meta.env.BASE_URL}exercise-media/${exerciseId}.svg`;
}

function fetchSvgSource(exerciseId: string): Promise<string | null> {
  const cached = svgSourceCache.get(exerciseId);

  if (cached !== undefined) {
    return cached;
  }

  const request = fetch(buildMediaUrl(exerciseId))
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const body = await response.text();

      // A dev server with history fallback answers a missing file with the
      // application's index.html rather than a 404, which would otherwise be
      // injected as though it were a drawing.
      return body.includes('<svg') ? body : null;
    })
    .catch(() => null);

  svgSourceCache.set(exerciseId, request);

  return request;
}

/**
 * Draws one exercise's animation, or an icon when there is not one yet.
 *
 * **Why the file is inlined rather than put in an `<img>`.** The whole point of
 * these being SVG is that they take their colours from the active palette's CSS
 * custom properties — see docs/EXERCISE_MEDIA_SPEC.md section 1. An `<img>` is
 * an isolated document that inherits nothing from the page, so the animation
 * would freeze on its fallback colours and stop following the palette switcher.
 *
 * **Why a shadow root rather than plain markup.** A `<style>` element inside an
 * inlined SVG is not scoped to that SVG: it applies to the whole document. Two
 * animations on one screen would fight over `.torso` and over each other's
 * `@keyframes` names, and their duplicated element ids would break
 * `aria-labelledby`. A shadow root scopes all three. Custom properties inherit
 * through the boundary, which is exactly the one thing that has to cross it.
 */
export function ExerciseAnimation({
  exerciseId,
  displayName,
  primaryMuscleGroups,
  className,
}: ExerciseAnimationProps) {
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);
  const shadowHostRef = useRef<HTMLDivElement | null>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  const resultForThisExercise = fetchResult?.exerciseId === exerciseId ? fetchResult : null;
  const svgSource = resultForThisExercise?.svgSource ?? null;

  useEffect(() => {
    let isStillMounted = true;

    void fetchSvgSource(exerciseId).then((fetchedSvgSource) => {
      if (isStillMounted) {
        setFetchResult({ exerciseId, svgSource: fetchedSvgSource });
      }
    });

    return () => {
      isStillMounted = false;
    };
  }, [exerciseId]);

  useEffect(() => {
    const shadowHost = shadowHostRef.current;

    if (shadowHost === null || svgSource === null) {
      return;
    }

    // attachShadow throws if called twice on the same element, and the host
    // element survives re-renders, so the root is created once and reused.
    shadowRootRef.current ??= shadowHost.shadowRoot ?? shadowHost.attachShadow({ mode: 'open' });

    // The only thing written here is a file committed to this repository, which
    // the validator has already proved contains no script, no event handler and
    // no external reference. See tools/exercise-media/validateExerciseSvg.mjs.
    shadowRootRef.current.innerHTML = `<style>svg{display:block;width:100%;height:100%}</style>${svgSource}`;
  }, [svgSource]);

  const combinedClassNames = [styles.animation, className].filter(Boolean).join(' ');

  const hasFinishedLoading = resultForThisExercise !== null;

  if (hasFinishedLoading && svgSource === null) {
    const fallbackIcon = findIconForMuscleGroups(primaryMuscleGroups);

    return (
      <div
        className={`${combinedClassNames} ${styles.isFallback}`}
        role="img"
        aria-label={`${displayName}. No animation for this movement yet.`}
      >
        {/*
         * createElement rather than JSX because the icon is looked up from a
         * table at render time. Written as `<FallbackIcon />` it reads to the
         * linter as a component being *defined* during render, which resets
         * state on every render. This one is a stable module-level component
         * being chosen, not made.
         */}
        {createElement(fallbackIcon, {
          className: styles.fallbackIcon,
          strokeWidth: 1.5,
          'aria-hidden': true,
        })}
      </div>
    );
  }

  return (
    <div
      ref={shadowHostRef}
      className={combinedClassNames}
      // Until the file arrives there is nothing to announce, and once it has
      // the SVG inside carries its own title and role.
      aria-busy={!hasFinishedLoading}
    />
  );
}
