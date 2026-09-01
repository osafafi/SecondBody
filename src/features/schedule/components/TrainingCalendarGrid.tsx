import { Link } from 'react-router-dom';

import { buildScheduleDayPath } from '@/app/appRoutes';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import type {
  TrainingCalendarDay,
  TrainingCalendarDayKind,
  TrainingCalendarWeek,
} from '@/domain/trainingCalendar';

import { describeWeekMonth, formatShortDate, formatWeekdayInitial } from '../scheduleWording';
import styles from './TrainingCalendarGrid.module.css';

export type TrainingCalendarGridProps = {
  weeks: TrainingCalendarWeek[];
};

/**
 * The training calendar: seven weeks of dots, and the way into any one of them.
 *
 * The four kinds of day are told apart by colour *and* by shape — a completed
 * day is filled, a planned one is outlined, a missed one is outlined and dashed.
 * Colour alone would leave the grid unreadable to anyone who cannot separate the
 * palette's green from its amber, and this is a screen whose entire content is
 * the difference between them.
 *
 * **Every row says which month it is in.** The grid is a rolling window of weeks
 * rather than a month, so without a heading it is a field of numbers between 1
 * and 31 with nothing saying which August they belong to. A row of seven days
 * can straddle two months, and `describeWeekMonth` gives it to whichever month
 * holds most of it. The heading is only drawn when the month changes, so a
 * window sitting inside one month gets one heading rather than seven.
 *
 * **A day with a session in it is a link.** Completed, unfinished and planned
 * days all go to the day view; rest days and missed days do not, because there
 * is nothing behind them to read. Every cell carries its own label for a screen
 * reader either way, because a grid of coloured dots says nothing out loud.
 */
export function TrainingCalendarGrid({ weeks }: TrainingCalendarGridProps) {
  const firstWeek = weeks[0];
  const rows = buildWeekRows(weeks);

  return (
    <GradientSurface as="section" variant="elevated" radius="large" className={styles.panel}>
      {firstWeek ? (
        <div className={styles.weekdayRow} aria-hidden>
          {firstWeek.days.map((day) => (
            <span key={day.isoDate} className={styles.weekdayInitial}>
              {formatWeekdayInitial(day.date)}
            </span>
          ))}
        </div>
      ) : null}

      <ol className={styles.weeks}>
        {rows.map(({ week, monthLabel }) => (
          <li
            key={week.days[0]?.isoDate ?? String(week.startDate.getTime())}
            className={styles.week}
          >
            {monthLabel ? <h3 className={styles.monthLabel}>{monthLabel}</h3> : null}

            <div className={styles.weekDays}>
              {week.days.map((day) => (
                <CalendarDayCell key={day.isoDate} day={day} />
              ))}
            </div>
          </li>
        ))}
      </ol>

      <CalendarLegend />
    </GradientSurface>
  );
}

type CalendarWeekRow = {
  week: TrainingCalendarWeek;

  /** The heading to draw above this row, or null when the month has not changed. */
  monthLabel: string | null;
};

/**
 * Each week paired with the month heading it should carry, if any.
 *
 * Derived up front rather than tracked with a running variable inside the map:
 * reassigning during render is exactly what `react-hooks/immutability` objects
 * to, and it is right to — a render that mutates as it goes is a render that
 * behaves differently the second time. Comparing each row to the one before it
 * is the same answer without the mutation, and the recomputation is seven short
 * date formats.
 */
function buildWeekRows(weeks: readonly TrainingCalendarWeek[]): CalendarWeekRow[] {
  return weeks.map((week, weekIndex) => {
    const monthLabel = describeWeekMonth(week.days.map((day) => day.date));
    const previousWeek = weeks[weekIndex - 1];

    const previousMonthLabel = previousWeek
      ? describeWeekMonth(previousWeek.days.map((day) => day.date))
      : null;

    return { week, monthLabel: monthLabel === previousMonthLabel ? null : monthLabel };
  });
}

const DAY_KIND_CLASS_NAMES: Record<TrainingCalendarDayKind, string> = {
  completedSession: styles.kindCompleted ?? '',
  unfinishedSession: styles.kindUnfinished ?? '',
  plannedSession: styles.kindPlanned ?? '',
  missedSession: styles.kindMissed ?? '',
  restDay: styles.kindRest ?? '',
};

const DAY_KIND_DESCRIPTIONS: Record<TrainingCalendarDayKind, string> = {
  completedSession: 'session completed',
  unfinishedSession: 'session started and not finished',
  plannedSession: 'session planned',
  missedSession: 'planned session missed',
  restDay: 'rest day',
};

/**
 * Which days open.
 *
 * A missed day is deliberately not one of them. It has no session document and
 * no projected letter — see the note at the top of `buildTrainingCalendar` about
 * why a missed day is never given a guess — so there is nothing on the other
 * side of the tap.
 */
const OPENABLE_DAY_KINDS: readonly TrainingCalendarDayKind[] = [
  'completedSession',
  'unfinishedSession',
  'plannedSession',
];

function CalendarDayCell({ day }: { day: TrainingCalendarDay }) {
  const cellClassNames = [
    styles.day,
    DAY_KIND_CLASS_NAMES[day.kind],
    day.isToday ? styles.isToday : null,
    OPENABLE_DAY_KINDS.includes(day.kind) ? styles.isOpenable : null,
  ]
    .filter(Boolean)
    .join(' ');

  /*
   * The letter is the useful mark on a training day, and the day of the month is
   * the useful mark everywhere else. Showing both would need a cell twice this
   * size, on the screen where a whole month has to fit across a phone.
   */
  const cellText = day.sessionLetter ?? String(day.date.getDate());

  const spokenLabel = (
    <span className={styles.screenReaderOnly}>
      {formatShortDate(day.date)}, {DAY_KIND_DESCRIPTIONS[day.kind]}
      {day.sessionLetter ? `, session ${day.sessionLetter}` : ''}
      {day.isToday ? ', today' : ''}
    </span>
  );

  const cellTitle = `${formatShortDate(day.date)} — ${DAY_KIND_DESCRIPTIONS[day.kind]}`;

  if (!OPENABLE_DAY_KINDS.includes(day.kind)) {
    return (
      <span className={cellClassNames} title={cellTitle}>
        <span className={styles.dayText} aria-hidden>
          {cellText}
        </span>
        {spokenLabel}
      </span>
    );
  }

  return (
    <Link className={cellClassNames} to={buildScheduleDayPath(day.isoDate)} title={cellTitle}>
      <span className={styles.dayText} aria-hidden>
        {cellText}
      </span>
      {spokenLabel}
    </Link>
  );
}

/** Which dot means what. The grid is meaningless without it. */
function CalendarLegend() {
  return (
    <ul className={styles.legend}>
      <li className={styles.legendItem}>
        <span
          className={`${styles.legendSwatch ?? ''} ${styles.kindCompleted ?? ''}`}
          aria-hidden
        />
        Done
      </li>
      <li className={styles.legendItem}>
        <span className={`${styles.legendSwatch ?? ''} ${styles.kindPlanned ?? ''}`} aria-hidden />
        Planned
      </li>
      <li className={styles.legendItem}>
        <span className={`${styles.legendSwatch ?? ''} ${styles.kindMissed ?? ''}`} aria-hidden />
        Missed
      </li>
    </ul>
  );
}
