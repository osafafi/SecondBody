import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SignedInUser } from '@/types/authenticationTypes';

/**
 * Firebase is mocked out of these tests entirely.
 *
 * Not to make them faster — because there is nothing here worth testing about
 * Firebase, and CLAUDE.md section 5 says so directly. What these tests are for
 * is the wiring: that the gate lets a signed-in user through to the app and
 * stops a signed-out one at the sign-in screen.
 *
 * `vi.hoisted` is needed because `vi.mock` factories are lifted above the
 * imports, so anything they close over has to be lifted with them.
 */
const authenticationTestState = vi.hoisted(() => ({
  signedInUser: null as { userId: string; displayName: string | null } | null,
}));

vi.mock('@/services/auth/googleAuthenticationService', () => ({
  observeSignedInUser: (handleSignedInUserChanged: (user: SignedInUser | null) => void) => {
    handleSignedInUserChanged(authenticationTestState.signedInUser as SignedInUser | null);

    return () => {};
  },
  collectRedirectSignInResult: () => Promise.resolve(),
  signInWithGoogle: () => Promise.resolve(),
  signOutOfApplication: () => Promise.resolve(),
}));

vi.mock('@/services/repositories/userDocumentRepository', () => ({
  USERS_COLLECTION_NAME: 'users',
  ensureUserDocumentExists: () => Promise.resolve(),
}));

const { App } = await import('./App');

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // HashRouter reads the hash, so reset it between tests.
    window.location.hash = '';
    authenticationTestState.signedInUser = { userId: 'test-user', displayName: 'Omar' };
  });

  it('opens on the Today screen', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument();
  });

  it('shows all four navigation destinations', () => {
    render(<App />);

    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });

    for (const destinationName of ['Today', 'Schedule', 'Progress', 'Settings']) {
      expect(screen.getByRole('link', { name: destinationName })).toBeInTheDocument();
    }

    expect(navigation).toBeInTheDocument();
  });

  it('navigates to Settings when the Settings tab is tapped', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Settings' }));

    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
  });
});

describe('the authentication gate', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '';
  });

  it('shows the sign-in screen instead of the app when nobody is signed in', () => {
    authenticationTestState.signedInUser = null;

    render(<App />);

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Today', level: 1 })).not.toBeInTheDocument();
  });

  it('keeps the bottom navigation out of reach while signed out', () => {
    authenticationTestState.signedInUser = null;

    render(<App />);

    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });
});
