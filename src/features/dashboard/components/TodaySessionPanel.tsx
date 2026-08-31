import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight, CircleCheck, Flag, Hourglass, Play } from 'lucide-react';
import type { ReactNode } from 'react';

import { APP_ROUTE_PATHS } from '@/app/appRoutes';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import type { DailyTrainingStance } from '@/domain/dailyTrainingStatus';
import type { SessionLetter } from '@/types/trainingVocabulary';

import {
  describeDaysSinceLastSession,
  describeMovementCount,
  describeTrainingDay,
  describeWaitUntilAllowed,
  formatTimeOfDay,
} from '../todayWording';
import styles from './TodaySessionPanel.module.css';

/**
 * The headline of the Today screen: what is on, and the way into it.
 *
 * The M5 placeholder this replaces was a link with no idea whether a session was
 * due. This one knows all six answers, and each is a genuinely different screen
 * rather than the same card with a different verb on the button.
 *
 * **The panel names movements and never weights.** Every number the session
 * prescribes is decided when the session opens, against history read at that
 * moment — a weight shown here would be a second opinion, and two opinions about
 * what goes on the bar is one too many. What is useful in advance is what he is
 * in for, which is the list of movements.
 */

export type TodaySessionPanelProps = {
  stance: DailyTrainingStance;

  /** Passed in rather than read here, so every relative date agrees. */
  now: Date;

  sessionLetter: SessionLetter;
  sessionDisplayName: string;
  sessionSummary: string;

  weekNumber: number;
  totalWeekCount: number;
  phaseDisplayName: string;
  isDeloadWeek: boolean;
  isCalibrationWeek: boolean;

  /** In session order, already filtered the way the planner filters them. */
  movementNames: string[];

  /** The 48-hour rail, and nothing else. Rest days can still start a session. */
  canStartSession: boolean;
  hoursUntilAllowed: number;
  earliestNextSessionAt: Date | null;
  nextAvailableTrainingDate: Date | null;
  daysSinceLastSession: number | null;
};

type PanelHeadline = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;

  /** The button's words, or null when there is nothing to offer. */
  actionLabel: string | null;

  /** Whether the movement list belongs under this headline. */
  shouldListMovements: boolean;
};

export function TodaySessionPanel(props: TodaySessionPanelProps) {
  const headline = resolvePanelHeadline(props);
  const sessionTitle = `Session ${props.sessionLetter} · ${props.sessionDisplayName}`;

  return (
    /*
     * `elevated`, not `accent`. DESIGN_SYSTEM.md section 4 reserves the accent
     * surface for "the one thing on screen that matters most — primary buttons,
     * the active set", and it is a solid brand gradient: secondary and muted
     * text sit on it at a contrast that is fine for three words and not fine for
     * six movement names and a paragraph. The emphasis this panel needs comes
     * from the solid badge and the gradient button instead, which is the same
     * hierarchy without the legibility cost.
     */
    <GradientSurface as="section" variant="elevated" radius="xlarge" className={styles.panel}>
      <div className={styles.headlineRow}>
        <IconBadge icon={headline.icon} isSolid size="large" />

        <div className={styles.headlineText}>
          <p className={styles.eyebrow}>{headline.eyebrow}</p>
          <h2 className={styles.title}>{headline.title}</h2>
        </div>
      </div>

      <p className={styles.description}>{headline.description}</p>

      {headline.shouldListMovements ? (
        <>
          <div className={styles.tagRow}>
            <span className={styles.tag}>
              Week {props.weekNumber} of {props.totalWeekCount}
            </span>
            <span className={styles.tag}>{props.phaseDisplayName}</span>
            {props.isCalibrationWeek ? (
              <span className={styles.tag}>Finding your starting weights</span>
            ) : null}
            {props.isDeloadWeek ? <span className={styles.tag}>Deload week</span> : null}
          </div>

          <div className={styles.movements}>
            <p className={styles.movementsLabel}>
              {sessionTitle} · {describeMovementCount(props.movementNames.length)}
            </p>

            <ul className={styles.movementList}>
              {props.movementNames.map((movementName) => (
                <li key={movementName} className={styles.movement}>
                  {movementName}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {/*
       * Two conditions, deliberately. The words come from the stance and the
       * permission comes from `canStartSessionFromTodayScreen`, which is the
       * 48-hour rail. If they ever disagree the rail wins, which is the only
       * direction that is safe to be wrong in.
       */}
      {headline.actionLabel && props.canStartSession ? (
        <Link className={styles.startLink} to={APP_ROUTE_PATHS.activeSession}>
          <Play size={18} strokeWidth={2.5} aria-hidden />
          {headline.actionLabel}
          <ChevronRight size={18} strokeWidth={2.5} aria-hidden />
        </Link>
      ) : null}
    </GradientSurface>
  );
}

/**
 * The words for each of the six stances.
 *
 * Kept as one function returning one shape rather than six branches scattered
 * through the markup, so that adding a stance means the compiler asks for its
 * words rather than the screen quietly rendering an empty card.
 *
 * Nothing here is in Harout's voice. These are labels; the coach's line for the
 * day is chosen separately and rendered beneath.
 */
function resolvePanelHeadline(props: TodaySessionPanelProps): PanelHeadline {
  const {
    stance,
    now,
    sessionLetter,
    sessionDisplayName,
    sessionSummary,
    hoursUntilAllowed,
    earliestNextSessionAt,
    nextAvailableTrainingDate,
    daysSinceLastSession,
  } = props;

  const sessionTitle = `Session ${sessionLetter} · ${sessionDisplayName}`;

  const nextSessionSentence = nextAvailableTrainingDate
    ? `Next up ${describeTrainingDay(nextAvailableTrainingDate, now)}: ${sessionTitle}.`
    : `Next up: ${sessionTitle}.`;

  switch (stance) {
    case 'sessionInProgress':
      return {
        eyebrow: 'Unfinished session',
        title: sessionDisplayName,
        description:
          'This one was started and never closed off. Everything already logged is still there.',
        icon: <Play size={22} strokeWidth={1.75} />,
        actionLabel: 'Pick it back up',
        shouldListMovements: false,
      };

    case 'programmeFinished':
      return {
        eyebrow: 'Programme complete',
        title: 'Twelve weeks, done',
        description:
          'Every week of this block is finished. There is no next session until a new programme is started.',
        icon: <Flag size={22} strokeWidth={1.75} />,
        actionLabel: null,
        shouldListMovements: false,
      };

    case 'trainedToday':
      return {
        eyebrow: 'Done for today',
        title: "That's today's work logged",
        description: nextSessionSentence,
        icon: <CircleCheck size={22} strokeWidth={1.75} />,
        actionLabel: null,
        shouldListMovements: false,
      };

    case 'recovering':
      return {
        eyebrow: 'Recovering',
        title: `Clear to train ${describeWaitUntilAllowed(hoursUntilAllowed)}`,
        description: buildRecoveryDescription(
          daysSinceLastSession,
          earliestNextSessionAt,
          sessionTitle,
        ),
        icon: <Hourglass size={22} strokeWidth={1.75} />,
        actionLabel: null,
        shouldListMovements: true,
      };

    case 'restDay':
      return {
        eyebrow: 'Rest day',
        title: 'Nothing scheduled today',
        /*
         * The training days are a plan rather than a rail, so this offers the
         * session anyway. A Wednesday missed for a late meeting is trained on
         * Thursday — see the note at the top of `dailyTrainingStatus.ts`.
         */
        description: `${nextSessionSentence} You are clear to train today if you would rather not wait.`,
        icon: <CalendarClock size={22} strokeWidth={1.75} />,
        actionLabel: 'Train it today instead',
        shouldListMovements: true,
      };

    case 'readyToTrain':
      return {
        eyebrow: "Today's session",
        title: sessionTitle,
        description: sessionSummary,
        icon: <Play size={22} strokeWidth={1.75} />,
        actionLabel: 'Start the session',
        shouldListMovements: true,
      };
  }
}

/** Why there is a wait, and when it ends. Both facts, no consolation. */
function buildRecoveryDescription(
  daysSinceLastSession: number | null,
  earliestNextSessionAt: Date | null,
  sessionTitle: string,
): string {
  const whenTrained =
    daysSinceLastSession === null
      ? 'You trained recently.'
      : `You trained ${describeDaysSinceLastSession(daysSinceLastSession)}.`;

  const whenClear = earliestNextSessionAt
    ? ` The programme keeps 48 hours between sessions, so ${sessionTitle} opens at ${formatTimeOfDay(earliestNextSessionAt)}.`
    : ` The programme keeps 48 hours between sessions. ${sessionTitle} is next.`;

  return whenTrained + whenClear;
}
