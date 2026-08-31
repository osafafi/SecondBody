import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { TodayScreen } from '@/features/dashboard/TodayScreen';
import { ExerciseMediaReviewScreen } from '@/features/exerciseMediaReview/ExerciseMediaReviewScreen';
import { ProgressScreen } from '@/features/progress/ProgressScreen';
import { ScheduleScreen } from '@/features/schedule/ScheduleScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { ColorPaletteProvider } from '@/theme/ColorPaletteProvider';

import { AppShell } from './AppShell';
import { APP_ROUTE_PATHS } from './appRoutes';
import { AuthenticationGate } from './AuthenticationGate';
import { AuthenticationProvider } from './AuthenticationProvider';

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
        <HashRouter>
          <Routes>
            {/* Everything that reads or writes user data sits behind the gate. */}
            <Route element={<AuthenticationGate />}>
              {/* Screens that live inside the shell, with the bottom navigation. */}
              <Route element={<AppShell />}>
                <Route path={APP_ROUTE_PATHS.today} element={<TodayScreen />} />
                <Route path={APP_ROUTE_PATHS.schedule} element={<ScheduleScreen />} />
                <Route path={APP_ROUTE_PATHS.progress} element={<ProgressScreen />} />
                <Route path={APP_ROUTE_PATHS.settings} element={<SettingsScreen />} />
              </Route>
            </Route>

            {/*
             * The exercise media contact sheet is a tool for reviewing generated
             * animations, not a screen of the app. It sits outside the shell so it
             * can use the full width of the window — the point of it is seeing many
             * animations at once, which a phone-width column cannot do.
             *
             * It also sits outside the authentication gate: it renders content from
             * `src/content/` and touches nothing personal, so requiring a sign-in to
             * look at a sheet of animations would be friction for no gain.
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

            {/*
             * The active session screen will be registered OUTSIDE the shell in M5,
             * so it takes over the whole display with nothing to tap by accident
             * mid-set. It goes INSIDE the gate — it writes sets to Firestore.
             */}

            {/* Anything unrecognised goes home rather than showing a blank screen. */}
            <Route path="*" element={<Navigate to={APP_ROUTE_PATHS.today} replace />} />
          </Routes>
        </HashRouter>
      </AuthenticationProvider>
    </ColorPaletteProvider>
  );
}
