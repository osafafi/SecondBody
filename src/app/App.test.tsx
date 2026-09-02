import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SignedInUser } from '@/types/authenticationTypes';
import type { UserProfile } from '@/types/userAccountTypes';

/**
 * Firebase is mocked out of these tests entirely.
 *
 * Not to make them faster — because there is nothing here worth testing about
 * Firebase, and CLAUDE.md section 5 says so directly. What these tests are for
 * is the wiring: that the two gates let a signed-in, onboarded user through, and
 * that each of them stops the case it exists to stop.
 *
 * Mocking the service modules also means `firebaseApp.ts` is never imported, so
 * no app is initialised and no IndexedDB cache is opened in jsdom.
 *
 * `vi.hoisted` is needed because `vi.mock` factories are lifted above the
 * imports, so anything they close over has to be lifted with them.
 */
const backend = vi.hoisted(() => ({
  signedInUser: null as { userId: string; displayName: string | null } | null,
  storedProfile: null as unknown,
  shouldProfileReadFail: false,
}));

vi.mock('@/services/auth/googleAuthenticationService', () => ({
  observeSignedInUser: (handleSignedInUserChanged: (user: SignedInUser | null) => void) => {
    handleSignedInUserChanged(backend.signedInUser as SignedInUser | null);

    return () => {};
  },
  collectRedirectSignInResult: () => Promise.resolve(),
  signInWithGoogle: () => Promise.resolve(),
  signOutOfApplication: () => Promise.resolve(),
}));

vi.mock('@/services/repositories/userDocumentRepository', () => ({
  ensureUserDocumentExists: () => Promise.resolve(),
}));

vi.mock('@/services/repositories/userProfileRepository', () => ({
  observeUserProfile: (
    _userId: string,
    handleProfileChanged: (profile: unknown) => void,
    handleProfileReadFailed: (error: unknown) => void,
  ) => {
    if (backend.shouldProfileReadFail) {
      handleProfileReadFailed(new Error('offline'));
    } else {
      handleProfileChanged(backend.storedProfile);
    }

    return () => {};
  },
  readUserProfile: () => Promise.resolve(backend.storedProfile),
  writeUserProfile: () => Promise.resolve(),
}));

vi.mock('@/services/repositories/userSettingsRepository', () => ({
  readUserSettings: () => Promise.resolve({}),
  writeUserSettings: () => Promise.resolve(),
  writeCompleteUserSettings: () => Promise.resolve(),
}));

/*
 * The session player's store imports these at module load, and importing them
 * for real would initialise Firebase and open an IndexedDB cache in jsdom —
 * which is exactly what the mocks above exist to prevent. The session player
 * has its own tests; these are about the gates and the routing.
 */
vi.mock('@/services/repositories/programAssignmentRepository', () => ({
  readActiveProgramAssignment: () => Promise.resolve(null),
  createProgramAssignment: () => Promise.resolve('assignment-1'),
  updateProgramAssignment: () => Promise.resolve(),
}));

vi.mock('@/services/repositories/workoutSessionRepository', () => ({
  createWorkoutSession: () => Promise.resolve('session-1'),
  saveWorkoutSession: () => Promise.resolve(),
  readInProgressWorkoutSession: () => Promise.resolve(null),
  readRecentWorkoutSessions: () => Promise.resolve([]),
}));

const { App } = await import('./App');

/**
 * The instant these tests run at.
 *
 * `buildOnboardedProfile` trains Monday, Wednesday and Friday, and the Today
 * screen only offers "Start the session" on a training day — on a rest day the
 * very same link reads "Train it today instead". Reading the real clock made
 * this file pass three days a week and fail the other four, which is how it went
 * green in CI on a Monday and red on the Tuesday.
 *
 * Deliberately written without a timezone: it parses as local time, so it is a
 * Monday on a runner in UTC and on a laptop in UTC+3 alike. It also sits after
 * the profile's `createdAt`, so the programme has started.
 *
 * Everything in `src/domain/` takes `now` as an argument precisely to avoid
 * this. A test that renders the whole app cannot, so it pins the clock instead.
 */
const A_MONDAY_DURING_THE_PROGRAMME = new Date('2026-09-07T09:00:00');

function buildOnboardedProfile(): UserProfile {
  return {
    displayName: 'Omar',
    birthYear: 1990,
    heightCentimetres: 178,
    startingWeightKilograms: 92,
    targetWeightKilograms: 83,
    painAreas: [],
    excludedExerciseIds: [],
    unavailableExerciseIds: [],
    availableEquipmentIds: ['dumbbells'],
    trainingDaysOfWeek: [1, 3, 5],
    hasCompletedOnboarding: true,
    createdAt: new Date('2026-08-31T10:00:00.000Z'),
    updatedAt: new Date('2026-08-31T10:00:00.000Z'),
  };
}

beforeEach(() => {
  /*
   * Only `Date` is faked. Faking the timers as well would stop Testing Library's
   * `findBy*` queries and `userEvent`'s delays from ever resolving.
   */
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(A_MONDAY_DURING_THE_PROGRAMME);

  window.localStorage.clear();
  // HashRouter reads the hash, so reset it between tests.
  window.location.hash = '';
  backend.signedInUser = { userId: 'test-user', displayName: 'Omar' };
  backend.storedProfile = buildOnboardedProfile();
  backend.shouldProfileReadFail = false;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('opens on the Today screen', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument();
  });

  it('shows all four navigation destinations', async () => {
    render(<App />);

    const navigation = await screen.findByRole('navigation', { name: 'Main navigation' });

    for (const destinationName of ['Today', 'Schedule', 'Progress', 'Settings']) {
      expect(screen.getByRole('link', { name: destinationName })).toBeInTheDocument();
    }

    expect(navigation).toBeInTheDocument();
  });

  it('offers a way into the session player', async () => {
    render(<App />);

    expect(await screen.findByRole('link', { name: /start the session/i })).toBeInTheDocument();
  });

  it('navigates to Settings when the Settings tab is tapped', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: 'Settings' }));

    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
  });
});

describe('the authentication gate', () => {
  it('shows the sign-in screen instead of the app when nobody is signed in', () => {
    backend.signedInUser = null;

    render(<App />);

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Today', level: 1 })).not.toBeInTheDocument();
  });

  it('keeps the bottom navigation out of reach while signed out', () => {
    backend.signedInUser = null;

    render(<App />);

    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });
});

describe('the onboarding gate', () => {
  it('asks the first onboarding question when there is no profile yet', async () => {
    backend.storedProfile = null;

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'About you', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Today', level: 1 })).not.toBeInTheDocument();
  });

  /*
   * A profile that exists but was abandoned halfway through on another device.
   * The flag is what says so, not the document's existence.
   */
  it('resumes onboarding when a profile exists but was never finished', async () => {
    backend.storedProfile = { ...buildOnboardedProfile(), hasCompletedOnboarding: false };

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'About you', level: 1 })).toBeInTheDocument();
  });

  /*
   * The branch that matters most. A failed read must not look like "no profile",
   * or a dropped connection walks someone who onboarded months ago back into
   * being asked their height.
   */
  it('offers a retry rather than onboarding again when the profile cannot be read', async () => {
    backend.shouldProfileReadFail = true;

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: /could not load your profile/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'About you' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('lets an onboarded user straight through to the app', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'About you' })).not.toBeInTheDocument();
  });
});
