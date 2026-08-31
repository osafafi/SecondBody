/**
 * Every route path in the application, in one place.
 *
 * Import from here rather than typing path strings — a typo in a `<Link to>` is
 * invisible until someone taps it in a gym.
 */
export const APP_ROUTE_PATHS = {
  today: '/',
  schedule: '/schedule',
  progress: '/progress',
  settings: '/settings',
  exerciseLibrary: '/library',
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
