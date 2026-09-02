import { createElement } from 'react';
import {
  Check,
  ChevronRight,
  Circle,
  CircleDot,
  Hourglass,
  SkipForward,
  X,
  type LucideIcon,
} from 'lucide-react';

import { ExerciseAnimation } from '@/components/ExerciseAnimation/ExerciseAnimation';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { findExerciseById } from '@/content/exercises/allExercises';
import {
  countSessionBoardEntriesLeft,
  type SessionBoardEntry,
  type SessionBoardEntryStatus,
} from '@/domain/sessionBoard';

import { describePrescriptionHeadline } from '../prescriptionWording';
import styles from './SessionBoardOverlay.module.css';

export type SessionBoardOverlayProps = {
  sessionDisplayName: string;
  entries: SessionBoardEntry[];

  onExercisePreviewed: (exerciseIndex: number) => void;
  onClosed: () => void;
};

type StatusPresentation = {
  label: string;
  icon: LucideIcon;

  /** The class that tints the badge. Absent for the quiet default. */
  toneClassName: string | undefined;
};

/**
 * How each state reads on a card.
 *
 * "Waiting on a machine" is spelled out rather than shortened, because the whole
 * point of F9 is that it is not a skip and must never be mistaken for one at a
 * glance.
 */
const PRESENTATION_BY_STATUS: Record<SessionBoardEntryStatus, StatusPresentation> = {
  notStarted: { label: 'To do', icon: Circle, toneClassName: undefined },
  inProgress: { label: 'Part way', icon: CircleDot, toneClassName: styles.statusInProgress },
  done: { label: 'Done', icon: Check, toneClassName: styles.statusDone },
  skipped: { label: 'Skipped', icon: SkipForward, toneClassName: styles.statusSkipped },
  waitingOnMachine: {
    label: 'Waiting on the machine',
    icon: Hourglass,
    toneClassName: styles.statusWaiting,
  },
};

/** "1 left", "3 left", "Nothing left". */
function describeHowMuchIsLeft(entriesLeftCount: number): string {
  if (entriesLeftCount === 0) {
    return 'Nothing left';
  }

  return entriesLeftCount === 1 ? '1 left' : `${String(entriesLeftCount)} left`;
}

/**
 * The whole session, as a grid of cards you can actually recognise.
 *
 * F10: the only place the session was listed was a column of names, and the
 * names are gym English — "low row, neutral grip" means nothing to someone who
 * has been training for a week. Every card carries the animation, which is what
 * makes it a picture of a machine rather than a phrase.
 *
 * Every card is tappable, including the finished ones. Tapping opens the
 * preview and nothing else: F8 is that looking at an exercise must not be a
 * commitment, so the only thing that reaches the state machine from here is a
 * deliberate "do this one now" on the preview underneath.
 */
export function SessionBoardOverlay({
  sessionDisplayName,
  entries,
  onExercisePreviewed,
  onClosed,
}: SessionBoardOverlayProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="All exercises">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{sessionDisplayName}</h2>
          <p className={styles.subtitle}>
            {String(entries.length)} movements ·{' '}
            {describeHowMuchIsLeft(countSessionBoardEntriesLeft(entries))}
          </p>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClosed}
          aria-label="Back to the session"
        >
          <X size={20} strokeWidth={2} aria-hidden />
        </button>
      </header>

      <ul className={styles.grid}>
        {entries.map((entry) => (
          <SessionBoardCard
            key={entry.plannedExercise.exerciseId}
            entry={entry}
            onPreviewed={() => {
              onExercisePreviewed(entry.exerciseIndex);
            }}
          />
        ))}
      </ul>

      <p className={styles.footnote}>
        Tapping a card just shows you what it is. Nothing is logged until you say so.
      </p>
    </div>
  );
}

function SessionBoardCard({
  entry,
  onPreviewed,
}: {
  entry: SessionBoardEntry;
  onPreviewed: () => void;
}) {
  const exercise = findExerciseById(entry.plannedExercise.exerciseId);
  const displayName = exercise?.displayName ?? entry.plannedExercise.exerciseId;
  const headline = describePrescriptionHeadline(entry.plannedExercise);
  const presentation = PRESENTATION_BY_STATUS[entry.status];

  return (
    <li>
      <button
        type="button"
        className={[styles.card, entry.isCurrent ? styles.isCurrent : ''].filter(Boolean).join(' ')}
        onClick={onPreviewed}
      >
        <GradientSurface
          variant={entry.isCurrent ? 'accent' : 'elevated'}
          radius="large"
          className={styles.cardSurface}
        >
          <ExerciseAnimation
            exerciseId={entry.plannedExercise.exerciseId}
            displayName={displayName}
            primaryMuscleGroups={exercise?.primaryMuscleGroups ?? []}
            className={styles.cardAnimation ?? ''}
          />

          <span className={styles.cardPosition}>
            {String(entry.exerciseIndex + 1)}
            {entry.isCurrent ? ' · you are here' : ''}
          </span>

          <span className={styles.cardName}>{displayName}</span>

          <span className={styles.cardPrescription}>
            {headline.value}
            {headline.unit ? ` ${headline.unit}` : ''} · {headline.detail}
          </span>

          <span
            className={[styles.cardStatus, presentation.toneClassName].filter(Boolean).join(' ')}
          >
            {/*
             * createElement rather than JSX: the icon comes from a table at
             * render time, and `<Icon />` reads to the linter as a component
             * being defined during render.
             */}
            {createElement(presentation.icon, {
              size: 13,
              strokeWidth: 2.5,
              'aria-hidden': true,
            })}
            {entry.status === 'inProgress'
              ? `${String(entry.loggedSetCount)} of ${String(entry.plannedExercise.workingSetCount)} sets`
              : presentation.label}
          </span>

          <span className={styles.cardChevron} aria-hidden>
            <ChevronRight size={16} strokeWidth={2.5} />
          </span>
        </GradientSurface>
      </button>
    </li>
  );
}
