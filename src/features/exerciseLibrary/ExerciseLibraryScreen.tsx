import { useState } from 'react';
import { BookOpen, ChevronRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buildExerciseDetailPath } from '@/app/appRoutes';
import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { allExercises } from '@/content/exercises/allExercises';
import {
  movementCategoryLabels,
  movementPatternLabels,
} from '@/content/vocabulary/trainingVocabularyLabels';
import { filterExerciseLibrary } from '@/domain/exerciseLibrarySearch';
import { MOVEMENT_CATEGORIES, type MovementCategory } from '@/types/trainingVocabulary';

import styles from './ExerciseLibraryScreen.module.css';
import { describeLibrarySize, describeMuscleGroups } from './exerciseLibraryWording';

/**
 * Every movement the app knows, outside any session.
 *
 * This is F2 in docs/FEEDBACK.md, answered. The path was reserved and unbuilt
 * for a year of milestones on the grounds that an animation is wanted in a
 * session and nowhere else. That turned out to be wrong the first time somebody
 * wanted to look up what a Pallof press was on a Tuesday.
 *
 * **It reads nothing from Firestore.** Everything on it is committed content, so
 * there is no loading state, no error state and nothing on it that can be
 * stale — which is why this is the one screen inside the shell that draws its
 * whole self on the first render.
 *
 * The search is `filterExerciseLibrary` in `src/domain/`, which is where the
 * rules that decide whether "lat pulldown" finds `latPulldownMachine` live and
 * are tested. Nothing on this screen decides anything except what to draw.
 */
export function ExerciseLibraryScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MovementCategory | null>(null);

  const matchingExercises = filterExerciseLibrary(allExercises, {
    searchText,
    movementCategory: selectedCategory,
  });

  return (
    <>
      <ScreenHeader
        title="Exercise library"
        subtitle={describeLibrarySize(matchingExercises.length, allExercises.length)}
        leadingSlot={<IconBadge icon={<BookOpen size={22} strokeWidth={1.75} />} isSolid />}
      />

      <div className={styles.body}>
        <GradientSurface variant="recessed" radius="large" className={styles.searchPanel}>
          <label className={styles.searchField}>
            <Search className={styles.searchIcon} size={18} strokeWidth={2} aria-hidden />

            <span className={styles.screenReaderOnly}>Search the exercise library</span>

            <input
              className={styles.searchInput}
              type="search"
              value={searchText}
              placeholder="Search a movement, or a muscle"
              /*
               * The gym is not the place to be corrected. A phone that
               * capitalises and autocorrects "lat" into "let" makes the search
               * look broken.
               */
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(changeEvent) => {
                setSearchText(changeEvent.target.value);
              }}
            />

            {searchText ? (
              <button
                className={styles.clearButton}
                type="button"
                aria-label="Clear the search"
                onClick={() => {
                  setSearchText('');
                }}
              >
                <X size={16} strokeWidth={2.5} aria-hidden />
              </button>
            ) : null}
          </label>

          <div className={styles.categoryRow} role="group" aria-label="Filter by kind of movement">
            <CategoryChip
              label="All"
              isSelected={selectedCategory === null}
              onSelected={() => {
                setSelectedCategory(null);
              }}
            />

            {MOVEMENT_CATEGORIES.map((movementCategory) => (
              <CategoryChip
                key={movementCategory}
                label={movementCategoryLabels[movementCategory]}
                isSelected={selectedCategory === movementCategory}
                onSelected={() => {
                  /* Tapping the selected chip again clears it, so "All" is never
                     the only way back to everything. */
                  setSelectedCategory((previousCategory) =>
                    previousCategory === movementCategory ? null : movementCategory,
                  );
                }}
              />
            ))}
          </div>
        </GradientSurface>

        {matchingExercises.length === 0 ? (
          <GradientSurface variant="outlined" radius="large" className={styles.emptyPanel}>
            <h2 className={styles.emptyTitle}>Nothing matches that</h2>
            <p className={styles.emptyMessage}>
              The library only holds the movements this programme prescribes, so it is a short list
              on purpose. Try a muscle — &ldquo;glutes&rdquo;, &ldquo;lats&rdquo; — or clear the
              search.
            </p>
          </GradientSurface>
        ) : (
          <ol className={styles.exerciseRows}>
            {matchingExercises.map((exercise) => (
              <li key={exercise.exerciseId}>
                <GradientSurface
                  as="div"
                  variant="elevated"
                  radius="large"
                  className={styles.exerciseCard}
                >
                  <Link
                    className={styles.exerciseLink}
                    to={buildExerciseDetailPath(exercise.exerciseId)}
                  >
                    <ExerciseAnimation
                      exerciseId={exercise.exerciseId}
                      displayName={exercise.displayName}
                      primaryMuscleGroups={exercise.primaryMuscleGroups}
                      className={styles.exerciseAnimation ?? ''}
                    />

                    <span className={styles.exerciseText}>
                      <span className={styles.exerciseName}>{exercise.displayName}</span>
                      <span className={styles.exercisePattern}>
                        {movementPatternLabels[exercise.movementPattern]}
                      </span>
                      <span className={styles.exerciseMuscles}>
                        {describeMuscleGroups(exercise.primaryMuscleGroups)}
                      </span>
                    </span>

                    <ChevronRight
                      className={styles.exerciseChevron}
                      size={18}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                </GradientSurface>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

function CategoryChip({
  label,
  isSelected,
  onSelected,
}: {
  label: string;
  isSelected: boolean;
  onSelected: () => void;
}) {
  return (
    <button
      className={[styles.categoryChip, isSelected ? styles.isSelected : null]
        .filter(Boolean)
        .join(' ')}
      type="button"
      aria-pressed={isSelected}
      onClick={onSelected}
    >
      {label}
    </button>
  );
}
