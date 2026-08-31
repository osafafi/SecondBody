import { Dumbbell } from 'lucide-react';

import { useAuthentication } from '@/app/useAuthentication';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { GoogleGlyph } from '@/components/icons/GoogleGlyph';
import { findCoachLinesByCategory } from '@/content/coachVoice/allCoachLines';
import { selectCoachLine } from '@/domain/coachLineSelection';

import styles from './SignInScreen.module.css';

/**
 * The only screen anybody sees while signed out.
 *
 * Everything the app knows lives behind a Google account, so there is nothing
 * useful to show before sign-in and no guest mode to fall back to.
 *
 * The welcome line comes from `src/content/coachVoice/` like every other thing
 * Harout says. Verbosity is fixed at `standard` here rather than read from
 * settings, because settings live in Firestore and there is nobody to load them
 * for yet — and the rotation index is fixed at zero for the same reason, there
 * being no session count to rotate on before anyone has signed in.
 */
export function SignInScreen() {
  const { startGoogleSignIn, isSignInInProgress, authenticationErrorMessage } = useAuthentication();

  const welcomeCoachLine = selectCoachLine({
    candidateLines: findCoachLinesByCategory('signInWelcome'),
    configuredVerbosity: 'standard',
    rotationIndex: 0,
    mayUsePraise: false,
  });

  const handleGoogleSignInPressed = () => {
    void startGoogleSignIn();
  };

  return (
    <main className={styles.screen}>
      <GradientSurface variant="glass" radius="xlarge" className={styles.panel}>
        <span className={styles.badge}>
          <Dumbbell size={26} strokeWidth={1.75} aria-hidden />
        </span>

        <div className={styles.textGroup}>
          <h1 className={styles.title}>Second Body</h1>
          {welcomeCoachLine ? <p className={styles.coachLine}>{welcomeCoachLine.text}</p> : null}
        </div>

        <GradientButton
          tone="primary"
          size="large"
          isFullWidth
          onClick={handleGoogleSignInPressed}
          disabled={isSignInInProgress}
          leadingIcon={<GoogleGlyph />}
        >
          {isSignInInProgress ? 'Signing in…' : 'Continue with Google'}
        </GradientButton>

        {/*
         * `role="alert"` rather than a plain paragraph: the message appears well
         * after the screen has been read, so a screen reader has to be told that
         * something changed.
         */}
        {authenticationErrorMessage ? (
          <p className={styles.errorMessage} role="alert">
            {authenticationErrorMessage}
          </p>
        ) : null}
      </GradientSurface>
    </main>
  );
}
