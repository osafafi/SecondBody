import { createElement } from 'react';

import { findIconForMuscleGroups } from '@/components/icons/muscleGroupIcons';
import {
  buildExerciseMediaUrl,
  findExerciseMediaMatch,
} from '@/content/exerciseMedia/allExerciseMedia';
import type { MuscleGroup } from '@/types/trainingVocabulary';

import styles from './ExerciseAnimation.module.css';

export type ExerciseAnimationProps = {
  /** The exercise's id, which is also its file name. */
  exerciseId: string;

  /** Names the animation, and the fallback when there is not one. */
  displayName: string;

  /** Decides which icon stands in when there is no animation. */
  primaryMuscleGroups: readonly MuscleGroup[];

  className?: string;
};

/**
 * Draws one exercise's animation, or says so when there is not one.
 *
 * **Why an `<img>` and not an inlined SVG.** These used to be hand-generated
 * SVGs that took their colours from the active palette. They are now 180×180
 * GIFs from an open dataset — see docs/EXERCISE_MEDIA_SPEC.md — which are
 * raster images and cannot follow the palette however they are embedded. So
 * there is nothing to gain from inlining them and a good deal to lose: an
 * `<img>` gets lazy loading, decoding off the main thread and the browser's
 * cache for free.
 *
 * **Why the match table decides, rather than a failed request.** Whether a file
 * exists is committed knowledge — `src/content/exerciseMedia/` holds the table
 * and a test proves it agrees with what is on disk — so the fallback renders
 * immediately instead of after a phone has waited out a 404 on gym wifi.
 */
export function ExerciseAnimation({
  exerciseId,
  displayName,
  primaryMuscleGroups,
  className,
}: ExerciseAnimationProps) {
  const combinedClassNames = [styles.animation, className].filter(Boolean).join(' ');

  if (findExerciseMediaMatch(exerciseId) === null) {
    const fallbackIcon = findIconForMuscleGroups(primaryMuscleGroups);

    return (
      <div
        className={`${combinedClassNames} ${styles.isFallback}`}
        role="img"
        aria-label={`${displayName}. No preview available for this movement yet.`}
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

        <span className={styles.fallbackLabel} aria-hidden>
          No preview yet
        </span>
      </div>
    );
  }

  return (
    <img
      className={combinedClassNames}
      src={buildExerciseMediaUrl(exerciseId)}
      // The animation is the whole content of the image, so it is described
      // rather than decorative. The name is enough: the form cues beside it say
      // everything the picture cannot.
      alt={`${displayName}, animated.`}
      width={180}
      height={180}
      loading="lazy"
      decoding="async"
    />
  );
}
