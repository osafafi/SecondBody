import { Outlet } from 'react-router-dom';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { PendingScreen } from '@/components/PendingScreen/PendingScreen';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';

import styles from './OnboardingGate.module.css';
import { useUserProfile } from './useUserProfile';

/**
 * Stands between signing in and the app itself.
 *
 * Nested inside `AuthenticationGate`, so by the time this renders there is
 * definitely a signed-in user and the only question left is whether they have a
 * profile.
 *
 * The `failed` branch is the one worth having. Without it a profile read that
 * failed on a bad connection would look identical to having no profile, and
 * someone who onboarded months ago would be asked their height again. Onboarding
 * writes with `merge` so nothing would actually be lost — but being asked is its
 * own kind of broken, so a failure says so and offers to retry.
 */
export function OnboardingGate() {
  const { userProfileStatus, profileErrorMessage, retryLoadingUserProfile } = useUserProfile();

  if (userProfileStatus === 'loading') {
    return <PendingScreen label="Loading your profile" />;
  }

  if (userProfileStatus === 'failed') {
    const handleRetryPressed = () => {
      retryLoadingUserProfile();
    };

    return (
      <main className={styles.screen}>
        <GradientSurface variant="glass" radius="xlarge" className={styles.panel}>
          <h1 className={styles.title}>Could not load your profile</h1>

          {profileErrorMessage ? (
            <p className={styles.message} role="alert">
              {profileErrorMessage}
            </p>
          ) : null}

          <GradientButton tone="primary" isFullWidth onClick={handleRetryPressed}>
            Try again
          </GradientButton>
        </GradientSurface>
      </main>
    );
  }

  if (userProfileStatus === 'needsOnboarding') {
    return <OnboardingFlow />;
  }

  return <Outlet />;
}
