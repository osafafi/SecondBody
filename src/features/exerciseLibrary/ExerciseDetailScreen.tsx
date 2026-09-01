import type { ReactNode } from 'react';
import { ArrowLeft, ChevronRight, HeartPulse, ShieldAlert } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { APP_ROUTE_PATHS, buildExerciseDetailPath } from '@/app/appRoutes';
import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { NavigationLink } from '@/components/NavigationLink/NavigationLink';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { findReasonExerciseHasNoMedia } from '@/content/exerciseMedia/allExerciseMedia';
import { findExerciseById } from '@/content/exercises/allExercises';
import {
  movementCategoryLabels,
  movementPatternLabels,
  painAreaLabels,
} from '@/content/vocabulary/trainingVocabularyLabels';
import type { ExerciseDefinition } from '@/types/exerciseTypes';
import type { PainArea } from '@/types/trainingVocabulary';

import styles from './ExerciseDetailScreen.module.css';
import { describeMuscleGroups, describeRequiredEquipment } from './exerciseLibraryWording';

/**
 * One movement, in full: the animation, what it works, how to do it, and how it
 * goes wrong.
 *
 * Everything here is already shown on `ExerciseBriefPanel` inside a session.
 * This is not a second copy of that panel — the brief has a prescription, a
 * weight, a set count and two buttons, all of which only mean something mid
 * session. What is shared is the *content*, and that lives in
 * `src/content/exercises/` and is read by both. Correcting a form cue corrects
 * it in the gym and in here at the same time.
 *
 * Reads nothing from Firestore, so there is no loading state, no error state
 * and nothing on it that can be stale. See the note on `ExerciseLibraryScreen`.
 */
export function ExerciseDetailScreen() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const exercise = exerciseId ? findExerciseById(exerciseId) : null;

  if (!exercise) {
    return (
      <>
        <ScreenHeader title="Not in the library" subtitle="Nothing is filed under that name" />

        <div className={styles.body}>
          <GradientSurface variant="outlined" radius="xlarge" className={styles.missingPanel}>
            <p className={styles.missingMessage}>
              The library only holds the movements this programme prescribes. If you followed a link
              to get here, the exercise it named has been renamed or removed.
            </p>

            <NavigationLink to={APP_ROUTE_PATHS.exerciseLibrary} isFullWidth>
              Back to the library
            </NavigationLink>
          </GradientSurface>
        </div>
      </>
    );
  }

  const reasonThereIsNoAnimation = findReasonExerciseHasNoMedia(exercise.exerciseId);

  const substitutes = exercise.substituteExerciseIds
    .map((substituteId) => findExerciseById(substituteId))
    .filter((substitute) => substitute !== null);

  return (
    <>
      <ScreenHeader
        title={exercise.displayName}
        subtitle={describeCategoryAndPattern(exercise)}
        trailingSlot={
          <NavigationLink
            to={APP_ROUTE_PATHS.exerciseLibrary}
            tone="ghost"
            size="compact"
            leadingIcon={<ArrowLeft size={16} strokeWidth={2} aria-hidden />}
          >
            Library
          </NavigationLink>
        }
      />

      <div className={styles.body}>
        <GradientSurface variant="elevated" radius="xlarge" className={styles.animationPanel}>
          <ExerciseAnimation
            exerciseId={exercise.exerciseId}
            displayName={exercise.displayName}
            primaryMuscleGroups={exercise.primaryMuscleGroups}
            className={styles.animation ?? ''}
          />

          {/*
           * Why there is no animation, when there is not one. The reason is
           * committed alongside the match table — see
           * docs/EXERCISE_MEDIA_SPEC.md — so a gap can be an explained gap
           * rather than a blank square that looks like a bug.
           */}
          {reasonThereIsNoAnimation ? (
            <p className={styles.noAnimationReason}>{reasonThereIsNoAnimation}</p>
          ) : null}
        </GradientSurface>

        <GradientSurface as="section" variant="recessed" radius="large" className={styles.facts}>
          <FactRow label="Works" value={describeMuscleGroups(exercise.primaryMuscleGroups)} />

          {exercise.secondaryMuscleGroups.length > 0 ? (
            <FactRow
              label="Also works"
              value={describeMuscleGroups(exercise.secondaryMuscleGroups)}
            />
          ) : null}

          <FactRow label="Needs" value={describeRequiredEquipment(exercise.requiredEquipmentIds)} />
        </GradientSurface>

        <GradientSurface as="section" variant="elevated" radius="large" className={styles.section}>
          <h2 className={styles.sectionHeading}>How to do it</h2>
          <ol className={styles.cueList}>
            {exercise.formCues.map((formCue) => (
              <li key={formCue}>{formCue}</li>
            ))}
          </ol>
        </GradientSurface>

        <GradientSurface as="section" variant="elevated" radius="large" className={styles.section}>
          <h2 className={styles.sectionHeading}>What goes wrong</h2>
          <ul className={styles.mistakeList}>
            {exercise.commonMistakes.map((commonMistake) => (
              <li key={commonMistake}>{commonMistake}</li>
            ))}
          </ul>
        </GradientSurface>

        <GradientSurface as="section" variant="accent" radius="large" className={styles.reason}>
          <h2 className={styles.sectionHeading}>Why it is in your programme</h2>
          <p className={styles.reasonText}>{exercise.whyItIsInTheProgramme}</p>
        </GradientSurface>

        {exercise.painAreasItHelps.length > 0 ? (
          <PainAreaPanel
            heading="Meant to help"
            detail="Over weeks rather than days."
            painAreas={exercise.painAreasItHelps}
            icon={<HeartPulse size={18} strokeWidth={2} />}
            tone="success"
          />
        ) : null}

        {exercise.painAreasToMonitor.length > 0 ? (
          <PainAreaPanel
            heading="Keep an eye on"
            detail="Not a warning against the movement — every exercise here was picked to be joint-friendly. This is what the app watches when you mark a set as having caused sharp pain."
            painAreas={exercise.painAreasToMonitor}
            icon={<ShieldAlert size={18} strokeWidth={2} />}
            tone="warning"
          />
        ) : null}

        {substitutes.length > 0 ? (
          <GradientSurface
            as="section"
            variant="elevated"
            radius="large"
            className={styles.section}
          >
            <h2 className={styles.sectionHeading}>If someone is on it</h2>
            <p className={styles.substituteIntro}>
              These train the same thing. Nothing swaps them in automatically — the programme still
              asks for the movement above.
            </p>

            <ul className={styles.substituteRows}>
              {substitutes.map((substitute) => (
                <li key={substitute.exerciseId}>
                  <Link
                    className={styles.substituteRow}
                    to={buildExerciseDetailPath(substitute.exerciseId)}
                  >
                    <ExerciseAnimation
                      exerciseId={substitute.exerciseId}
                      displayName={substitute.displayName}
                      primaryMuscleGroups={substitute.primaryMuscleGroups}
                      className={styles.substituteAnimation ?? ''}
                    />

                    <span className={styles.substituteName}>{substitute.displayName}</span>

                    <ChevronRight
                      className={styles.substituteChevron}
                      size={18}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </GradientSurface>
        ) : null}
      </div>
    </>
  );
}

/**
 * "Strength · Squat", or just "Mobility" when both words are the same.
 *
 * Every mobility drill is in the `mobility` category *and* has the `mobility`
 * pattern, so the naive join reads "Mobility · Mobility", which looks like a
 * rendering bug rather than like two facts that happen to agree.
 */
function describeCategoryAndPattern(exercise: ExerciseDefinition): string {
  const categoryLabel = movementCategoryLabels[exercise.movementCategory];
  const patternLabel = movementPatternLabels[exercise.movementPattern];

  return categoryLabel === patternLabel ? categoryLabel : `${categoryLabel} · ${patternLabel}`;
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.factRow}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>{value}</dd>
    </div>
  );
}

function PainAreaPanel({
  heading,
  detail,
  painAreas,
  icon,
  tone,
}: {
  heading: string;
  detail: string;
  painAreas: PainArea[];
  icon: ReactNode;
  tone: 'success' | 'warning';
}) {
  return (
    <GradientSurface as="section" variant="outlined" radius="large" className={styles.painPanel}>
      <div className={styles.painHeading}>
        <IconBadge icon={icon} tone={tone} size="small" />
        <h2 className={styles.sectionHeading}>{heading}</h2>
      </div>

      <p className={styles.painAreas}>
        {painAreas.map((painArea) => painAreaLabels[painArea]).join(', ')}
      </p>

      <p className={styles.painDetail}>{detail}</p>
    </GradientSurface>
  );
}
