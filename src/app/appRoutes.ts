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

  /**
   * The training journal (M10). Inside the app shell but deliberately not in
   * the bottom navigation — four targets across a phone is comfortable and five
   * is fiddly, so it is reached from the Today screen. See `BottomNavigation`.
   */
  journal: '/journal',

  /**
   * Reserved, and **not built**. No feature owns this path and no `<Route>` is
   * registered for it, so navigating here falls through to the catch-all and
   * lands on Today. It is kept because the path is referenced by name in
   * `BottomNavigation`'s comment explaining why the library is absent, and a
   * reserved path is cheaper than a second opinion about what it should be.
   * See the exercise library row in `src/features/README.md`.
   */
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
