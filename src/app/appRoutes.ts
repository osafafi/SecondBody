/**
 * Every route path in the application, in one place.
 *
 * Import from here rather than typing path strings — a typo in a `<Link to>` is
 * invisible until someone taps it in a gym.
 *
 * Paths with a parameter in them are declared in the form React Router matches
 * on, and have a builder underneath that fills the parameter in. Both halves
 * live here so that the pattern and the thing that satisfies it cannot drift.
 */
export const APP_ROUTE_PATHS = {
  today: '/',
  schedule: '/schedule',
  progress: '/progress',
  settings: '/settings',

  /**
   * One day of the calendar: what was trained that day, or what is planned for
   * it. Nested under Schedule so the bottom navigation keeps the Schedule tab
   * lit while you are reading a day.
   *
   * Keyed by the calendar date rather than by a session id, because a future day
   * has no session document to name and is exactly what this screen exists to
   * show. See `features/schedule/SessionDetailScreen.tsx`.
   */
  scheduleDay: '/schedule/day/:isoDate',

  /**
   * The training journal (M10). Inside the app shell but deliberately not in
   * the bottom navigation — four targets across a phone is comfortable and five
   * is fiddly, so it is reached from the Today screen. See `BottomNavigation`.
   */
  journal: '/journal',

  /**
   * Every exercise the app knows, with its animation and its cues, outside any
   * session. Reserved and unbuilt until F2 in docs/FEEDBACK.md, which Omar
   * answered by asking for exactly this.
   *
   * Not in the bottom navigation, for the same reason the journal is not — the
   * ways in are the Today screen and the movement rows on a session.
   */
  exerciseLibrary: '/library',

  /** One exercise, in full. */
  exerciseDetail: '/library/:exerciseId',

  activeSession: '/session',

  /**
   * A development-only contact sheet of every exercise animation. Registered
   * only when `import.meta.env.DEV` is true, so it is not in the built app —
   * see `App.tsx`. The path lives here anyway, because a path typed in two
   * places is a path that will disagree with itself.
   */
  exerciseMediaReview: '/exercise-media',
} as const;

export type AppRoutePath = (typeof APP_ROUTE_PATHS)[keyof typeof APP_ROUTE_PATHS];

/** The day view for one ISO `YYYY-MM-DD` calendar date. */
export function buildScheduleDayPath(isoDate: string): string {
  return `/schedule/day/${isoDate}`;
}

/**
 * The library entry for one exercise.
 *
 * Exercise ids are camelCase by contract — see `ExerciseDefinition.exerciseId`,
 * which is also a filename — so there is nothing here that needs escaping.
 */
export function buildExerciseDetailPath(exerciseId: string): string {
  return `/library/${exerciseId}`;
}
