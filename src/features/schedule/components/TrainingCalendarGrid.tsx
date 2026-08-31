import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import type {
  TrainingCalendarDay,
  TrainingCalendarDayKind,
  TrainingCalendarWeek,
} from '@/domain/trainingCalendar';

import { formatShortDate, formatWeekdayInitial } from '../scheduleWording';
import styles from './TrainingCalendarGrid.module.css';

export type TrainingCalendarGridProps = {
  weeks: TrainingCalendarWeek[];
};

/**
 * The training calendar: five weeks of dots.
 *
 * The four kinds of day are told apart by colour *and* by shape — a completed
 * day is filled, a planned one is outlined, a missed one is outlined and dashed.
 * Colour alone would leave the grid unreadable to anyone who cannot separate the
 * palette's green from its amber, and this is a screen whose entire content is
 * the difference between them.
 *
 * Every cell carries its own label for a screen reader, because a grid of
 * coloured dots says nothing out loud.
 */
export function TrainingCalendarGrid({ weeks }: TrainingCalendarGridProps) {
  const firstWeek = weeks[0];

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
        {weeks.map((week) => (
          <li
            key={week.days[0]?.isoDate ?? String(week.startDate.getTime())}
            className={styles.week}
          >
            {week.days.map((day) => (
              <CalendarDayCell key={day.isoDate} day={day} />
            ))}
          </li>
        ))}
      </ol>

      <CalendarLegend />
    </GradientSurface>
  );
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

function CalendarDayCell({ day }: { day: TrainingCalendarDay }) {
  const cellClassNames = [
    styles.day,
    DAY_KIND_CLASS_NAMES[day.kind],
    day.isToday ? styles.isToday : null,
  ]
    .filter(Boolean)
    .join(' ');

  /*
   * The letter is the useful mark on a training day, and the day of the month is
   * the useful mark everywhere else. Showing both would need a cell twice this
   * size, on the screen where a whole month has to fit across a phone.
   */
  const cellText = day.sessionLetter ?? String(day.date.getDate());

  return (
    <span
      className={cellClassNames}
      title={`${formatShortDate(day.date)} — ${DAY_KIND_DESCRIPTIONS[day.kind]}`}
    >
      <span className={styles.dayText} aria-hidden>
        {cellText}
      </span>
      <span className={styles.screenReaderOnly}>
        {formatShortDate(day.date)}, {DAY_KIND_DESCRIPTIONS[day.kind]}
        {day.sessionLetter ? `, session ${day.sessionLetter}` : ''}
        {day.isToday ? ', today' : ''}
      </span>
    </span>
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
