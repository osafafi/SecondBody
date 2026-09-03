import { useState } from 'react';
import { Link } from 'react-router-dom';

import { APP_ROUTE_PATHS } from '@/app/appRoutes';
import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { hasExerciseMedia } from '@/content/exerciseMedia/allExerciseMedia';
import { allExercises } from '@/content/exercises/allExercises';
import { useColorPalette } from '@/theme/useColorPalette';
import { MOVEMENT_CATEGORIES, type MovementCategory } from '@/types/trainingVocabulary';

import styles from './ExerciseMediaReviewScreen.module.css';

const CATEGORY_HEADINGS: Record<MovementCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  mobility: 'Mobility and warm-up',
};

/**
 * Every exercise animation on one page, at the size it is actually looked at.
 *
 * docs/EXERCISE_MEDIA_SPEC.md section 8 lists what a person has to check that
 * the verifier cannot: that the animation is of the movement it is attached to,
 * that it reads at phone size, and that inverting it for the dark theme has not
 * made a mess of it. Twenty-seven of the thirty-six are matched to an open
 * dataset rather than drawn for this app, and eight of those are marked as close
 * rather than exact, so "is this actually the right exercise" is a real question
 * with a real answer here. The eight generated for this app are the other reason
 * to look: whether they pass for the same set at 160 px is only answerable by
 * putting them next to the ones they are imitating.
 *
 * Checking that across three dozen files by opening three dozen files is how it
 * stops getting done, so this screen puts them all in one place.
 *
 * It is registered only in development and is tree-shaken out of the production
 * build. See `src/app/App.tsx`.
 */
export function ExerciseMediaReviewScreen() {
  const { selectedColorPalette, availableColorPalettes, selectColorPaletteById } =
    useColorPalette();
  const [isShowingLargeSize, setIsShowingLargeSize] = useState(false);

  // Counted rather than written down, so the subtitle cannot go stale the day
  // somebody resolves one of the gaps. Spotting the gaps is what this screen is
  // for, so how many there are belongs at the top of it.
  const exerciseCountWithAnimations = allExercises.filter((exercise) =>
    hasExerciseMedia(exercise.exerciseId),
  ).length;

  const exerciseCountWithoutAnimations = allExercises.length - exerciseCountWithAnimations;

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title="Exercise media review"
        subtitle={`${exerciseCountWithAnimations} animations, ${exerciseCountWithoutAnimations} with no preview yet. Development only — this screen is not in the built app.`}
        trailingSlot={
          <Link className={styles.backLink} to={APP_ROUTE_PATHS.today}>
            Back to the app
          </Link>
        }
      />

      <GradientSurface variant="outlined" className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Palette</span>
          <div className={styles.buttonRow}>
            {availableColorPalettes.map((palette) => (
              <button
                key={palette.paletteId}
                type="button"
                className={
                  palette.paletteId === selectedColorPalette.paletteId
                    ? `${styles.toggleButton} ${styles.isActive}`
                    : styles.toggleButton
                }
                onClick={() => {
                  selectColorPaletteById(palette.paletteId);
                }}
              >
                {palette.displayName}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Size</span>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={
                isShowingLargeSize
                  ? styles.toggleButton
                  : `${styles.toggleButton} ${styles.isActive}`
              }
              onClick={() => {
                setIsShowingLargeSize(false);
              }}
            >
              Phone (160 px)
            </button>
            <button
              type="button"
              className={
                isShowingLargeSize
                  ? `${styles.toggleButton} ${styles.isActive}`
                  : styles.toggleButton
              }
              onClick={() => {
                setIsShowingLargeSize(true);
              }}
            >
              Large
            </button>
          </div>
        </div>
      </GradientSurface>

      {MOVEMENT_CATEGORIES.map((movementCategory) => {
        const exercisesInCategory = allExercises.filter(
          (exercise) => exercise.movementCategory === movementCategory,
        );

        if (exercisesInCategory.length === 0) {
          return null;
        }

        return (
          <section key={movementCategory} className={styles.categorySection}>
            <h2 className={styles.categoryHeading}>
              {CATEGORY_HEADINGS[movementCategory]}
              <span className={styles.categoryCount}>{exercisesInCategory.length}</span>
            </h2>

            <div className={isShowingLargeSize ? styles.largeGrid : styles.phoneGrid}>
              {exercisesInCategory.map((exercise) => (
                <GradientSurface
                  key={exercise.exerciseId}
                  variant="elevated"
                  className={styles.card}
                >
                  <ExerciseAnimation
                    exerciseId={exercise.exerciseId}
                    displayName={exercise.displayName}
                    primaryMuscleGroups={exercise.primaryMuscleGroups}
                  />

                  <p className={styles.exerciseName}>{exercise.displayName}</p>
                  <p className={styles.exerciseMeta}>{exercise.exerciseId}</p>
                  <p className={styles.exerciseMeta}>{exercise.primaryMuscleGroups.join(', ')}</p>
                </GradientSurface>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
