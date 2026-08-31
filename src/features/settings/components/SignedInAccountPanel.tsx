import { LogOut } from 'lucide-react';

import { useAuthentication } from '@/app/useAuthentication';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';

import styles from './SignedInAccountPanel.module.css';

/**
 * Which Google account the app is currently signed in to, and the way out.
 *
 * Showing the address rather than only the name is deliberate. Signing in with
 * the wrong Google account produces an app that looks completely normal and is
 * simply empty — see the "data appears then vanishes" row in the
 * docs/SETUP_FIREBASE.md troubleshooting table. The address is what makes that
 * diagnosable at a glance.
 */
export function SignedInAccountPanel() {
  const { signedInUser, signOut, authenticationErrorMessage } = useAuthentication();

  if (!signedInUser) {
    return null;
  }

  const handleSignOutPressed = () => {
    void signOut();
  };

  return (
    <GradientSurface variant="outlined" className={styles.panel}>
      <div className={styles.identity}>
        {signedInUser.displayName ? (
          <p className={styles.displayName}>{signedInUser.displayName}</p>
        ) : null}

        {signedInUser.emailAddress ? (
          <p className={styles.emailAddress}>{signedInUser.emailAddress}</p>
        ) : null}
      </div>

      <GradientButton
        tone="ghost"
        onClick={handleSignOutPressed}
        leadingIcon={<LogOut size={16} strokeWidth={2} aria-hidden />}
      >
        Sign out
      </GradientButton>

      {authenticationErrorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {authenticationErrorMessage}
        </p>
      ) : null}
    </GradientSurface>
  );
}
