import { useState } from 'react';
import { Link } from 'react-router-dom';

import { APP_ROUTE_PATHS } from '@/app/appRoutes';
import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
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
 * docs/EXERCISE_MEDIA_SPEC.md section 9 lists what a person has to check that
 * the validator cannot: that the movement is right, that the right muscle
 * glows, that it reads at phone size, and that it still looks right in another
 * palette. Checking that across three dozen files by opening three dozen files
 * is how it stops getting done, so this screen puts them all in one place with
 * the palette switcher next to them.
 *
 * It is registered only in development and is tree-shaken out of the production
 * build. See `src/app/App.tsx`.
 */
export function ExerciseMediaReviewScreen() {
  const { selectedColorPalette, availableColorPalettes, selectColorPaletteById } =
    useColorPalette();
  const [isShowingLargeSize, setIsShowingLargeSize] = useState(false);

  const exercisesWithAnimations = allExercises.length;

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title="Exercise media review"
        subtitle={`${exercisesWithAnimations} exercises. Development only — this screen is not in the built app.`}
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
