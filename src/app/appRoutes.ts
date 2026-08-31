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
} as const;

export type AppRoutePath = (typeof APP_ROUTE_PATHS)[keyof typeof APP_ROUTE_PATHS];
