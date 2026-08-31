import { Outlet } from 'react-router-dom';

import { SignInScreen } from '@/features/authentication/SignInScreen';

import styles from './AuthenticationGate.module.css';
import { useAuthentication } from './useAuthentication';

/**
 * Stands in front of every screen that reads or writes user data.
 *
 * Used as a layout route, so the screens behind it can take a signed-in user for
 * granted instead of each one checking. The development-only exercise media
 * contact sheet is registered outside it on purpose — that screen renders
 * content out of `src/content/`, touches nothing personal, and having to sign in
 * to look at a sheet of animations would be friction for no gain.
 *
 * The `checking` branch is the one that earns its place: without it the sign-in
 * screen would flash on every refresh before Firebase finished restoring the
 * session.
 */
export function AuthenticationGate() {
  const { authenticationStatus } = useAuthentication();

  if (authenticationStatus === 'checking') {
    return (
      <div className={styles.checkingScreen} role="status">
        <span className={styles.checkingPulse} aria-hidden />
        <span className={styles.checkingLabel}>Checking your session</span>
      </div>
    );
  }

  if (authenticationStatus === 'signedOut') {
    return <SignInScreen />;
  }

  return <Outlet />;
}
