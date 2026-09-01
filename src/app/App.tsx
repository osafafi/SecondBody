import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ActiveSessionScreen } from '@/features/activeSession/ActiveSessionScreen';
import { TodayScreen } from '@/features/dashboard/TodayScreen';
import { ExerciseDetailScreen } from '@/features/exerciseLibrary/ExerciseDetailScreen';
import { ExerciseLibraryScreen } from '@/features/exerciseLibrary/ExerciseLibraryScreen';
import { ExerciseMediaReviewScreen } from '@/features/exerciseMediaReview/ExerciseMediaReviewScreen';
import { JournalScreen } from '@/features/journal/JournalScreen';
import { ProgressScreen } from '@/features/progress/ProgressScreen';
import { ScheduleScreen } from '@/features/schedule/ScheduleScreen';
import { SessionDetailScreen } from '@/features/schedule/SessionDetailScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { ColorPaletteProvider } from '@/theme/ColorPaletteProvider';

import { AppShell } from './AppShell';
import { APP_ROUTE_PATHS } from './appRoutes';
import { AuthenticationGate } from './AuthenticationGate';
import { AuthenticationProvider } from './AuthenticationProvider';
import { OnboardingGate } from './OnboardingGate';
import { UserProfileProvider } from './UserProfileProvider';

/**
 * Application root: providers, then routes.
 *
 * HashRouter rather than BrowserRouter, because GitHub Pages serves static files
 * with no server-side rewriting — a deep link would 404 on refresh. Hash routes
 * never reach the server. See docs/ARCHITECTURE.md section 7.
 *
 * The palette provider sits outside the authentication provider so that the
 * sign-in screen and the session-checking screen are already in the right
 * colours — they render before anybody is signed in.
 */
export function App() {
  return (
    <ColorPaletteProvider>
      <AuthenticationProvider>
        <UserProfileProvider>
          <HashRouter>
            <Routes>
              {/* Everything that reads or writes user data sits behind the gates. */}
              <Route element={<AuthenticationGate />}>
                {/*
                 * Signed in, but the profile still has to exist before a screen
                 * can render a programme built from it.
                 */}
                <Route element={<OnboardingGate />}>
                  {/* Screens inside the shell, with the bottom navigation. */}
                  <Route element={<AppShell />}>
                    <Route path={APP_ROUTE_PATHS.today} element={<TodayScreen />} />
                    <Route path={APP_ROUTE_PATHS.schedule} element={<ScheduleScreen />} />

                    {/*
                     * One day of the calendar. Nested under Schedule so the
                     * bottom navigation keeps the Schedule tab lit while a day
                     * is open, and inside the shell because reading a day is
                     * browsing rather than training — unlike the player below.
                     */}
                    <Route path={APP_ROUTE_PATHS.scheduleDay} element={<SessionDetailScreen />} />

                    <Route path={APP_ROUTE_PATHS.progress} element={<ProgressScreen />} />
                    <Route path={APP_ROUTE_PATHS.journal} element={<JournalScreen />} />

                    {/*
                     * The exercise library. Both screens read only committed
                     * content, so neither has a loading state — but they sit
                     * inside the gates anyway, because a screen inside the shell
                     * needs the bottom navigation under it to get back out.
                     */}
                    <Route
                      path={APP_ROUTE_PATHS.exerciseLibrary}
                      element={<ExerciseLibraryScreen />}
                    />
                    <Route
                      path={APP_ROUTE_PATHS.exerciseDetail}
                      element={<ExerciseDetailScreen />}
                    />

                    <Route path={APP_ROUTE_PATHS.settings} element={<SettingsScreen />} />
                  </Route>

                  {/*
                   * The session player sits INSIDE both gates — it writes sets to
                   * Firestore — and OUTSIDE the shell, so it takes over the whole
                   * display with no bottom navigation to hit by accident mid-set.
                   * M1 left a note here asking for exactly this; M5 delivers it.
                   */}
                  <Route path={APP_ROUTE_PATHS.activeSession} element={<ActiveSessionScreen />} />
                </Route>
              </Route>

              {/*
               * The exercise media contact sheet is a tool for reviewing generated
               * animations, not a screen of the app. It sits outside the shell so it
               * can use the full width of the window — the point of it is seeing many
               * animations at once, which a phone-width column cannot do.
               *
               * It also sits outside both gates: it renders content from
               * `src/content/` and touches nothing personal, so signing in and filling
               * in a profile to look at a sheet of animations would be friction for no
               * gain.
               *
               * `import.meta.env.DEV` is a compile-time constant, so this branch and
               * the screen it names are removed from the production bundle entirely.
               */}
              {import.meta.env.DEV ? (
                <Route
                  path={APP_ROUTE_PATHS.exerciseMediaReview}
                  element={<ExerciseMediaReviewScreen />}
                />
              ) : null}

              {/* Anything unrecognised goes home rather than showing a blank screen. */}
              <Route path="*" element={<Navigate to={APP_ROUTE_PATHS.today} replace />} />
            </Routes>
          </HashRouter>
        </UserProfileProvider>
      </AuthenticationProvider>
    </ColorPaletteProvider>
  );
}
