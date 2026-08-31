import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildLoggedExercise, buildLoggedSet } from '@/test/trainingTestFactories';
import type { ProgramAssignment, WorkoutSession } from '@/types/trainingHistoryTypes';
import { DEFAULT_USER_SETTINGS, type UserProfile } from '@/types/userAccountTypes';

/**
 * The session player's transitions, driven the way a person drives them.
 *
 * docs/ARCHITECTURE.md section 9 asks for exactly this and only this at the
 * feature level: the machine's rules already have unit tests in
 * `src/domain/activeSessionMachine.test.ts`, so what is worth proving here is
 * that the screen is wired to them — that "Set done" reaches the machine, and
 * that a set logged with sharp pain really does end that exercise on screen.
 *
 * Firebase is mocked out entirely, as it is in `src/app/App.test.tsx`, and for
 * the same reason: CLAUDE.md section 5 says not to test Firebase. What is
 * asserted about the repositories is that the session gets written at all.
 */
const backend = vi.hoisted(() => ({
  activeAssignment: null as ProgramAssignment | null,
  interruptedSession: null as unknown,
  recentSessions: [] as WorkoutSession[],
  createdSessions: [] as unknown[],
  savedSessions: [] as unknown[],
  updatedAssignments: [] as unknown[],
}));

vi.mock('@/services/repositories/programAssignmentRepository', () => ({
  readActiveProgramAssignment: () =>
    Promise.resolve(
      backend.activeAssignment === null
        ? null
        : { ...backend.activeAssignment, documentId: 'assignment-1' },
    ),
  createProgramAssignment: () => Promise.resolve('assignment-1'),
  updateProgramAssignment: (_userId: string, _assignmentId: string, changes: unknown) => {
    backend.updatedAssignments.push(changes);

    return Promise.resolve();
  },
}));

vi.mock('@/services/repositories/workoutSessionRepository', () => ({
  createWorkoutSession: (_userId: string, session: unknown) => {
    backend.createdSessions.push(session);

    return Promise.resolve('session-1');
  },
  saveWorkoutSession: (_userId: string, _sessionId: string, session: unknown) => {
    backend.savedSessions.push(session);

    return Promise.resolve();
  },
  readInProgressWorkoutSession: () => Promise.resolve(backend.interruptedSession),
  readRecentWorkoutSessions: () => Promise.resolve(backend.recentSessions),
}));

vi.mock('@/services/repositories/userSettingsRepository', () => ({
  readUserSettings: () => Promise.resolve({ ...DEFAULT_USER_SETTINGS, updatedAt: new Date() }),
}));

vi.mock('@/app/useAuthentication', () => ({
  useAuthentication: () => ({
    signedInUser: { userId: 'test-user', displayName: 'Omar', emailAddress: null },
  }),
}));

/*
 * One profile object for the whole file, not a fresh one per render. The screen
 * prepares the session when the profile identity changes, so a mock that built a
 * new object every render would ask it to re-plan for ever.
 */
vi.mock('@/app/useUserProfile', () => ({
  useUserProfile: () => ({ userProfile: signedInProfile }),
}));

function buildProfile(): UserProfile {
  return {
    displayName: 'Omar',
    birthYear: 1990,
    heightCentimetres: 190,
    startingWeightKilograms: 90,
    targetWeightKilograms: 83,
    painAreas: [],
    excludedExerciseIds: [],
    availableEquipmentIds: ['dumbbells'],
    trainingDaysOfWeek: [1, 3, 5],
    hasCompletedOnboarding: true,
    createdAt: new Date('2026-08-31T10:00:00.000Z'),
    updatedAt: new Date('2026-08-31T10:00:00.000Z'),
  };
}

const signedInProfile = buildProfile();

function buildAssignment(overrides: Partial<ProgramAssignment> = {}): ProgramAssignment {
  return {
    programTemplateId: 'twelveWeekFoundation',
    startedOn: '2026-09-01',
    currentPhaseNumber: 1,
    currentWeekNumber: 2,
    nextSessionLetter: 'A',
    status: 'active',
    completedOn: null,
    ...overrides,
  };
}

const { ActiveSessionScreen } = await import('./ActiveSessionScreen');
const { useActiveSessionStore } = await import('./useActiveSessionStore');

function renderScreen() {
  return render(
    <MemoryRouter>
      <ActiveSessionScreen />
    </MemoryRouter>,
  );
}

/** Warm-up out of the way, so a test can get to the part it is about. */
async function finishTheWarmup(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /i.m warm/i }));
}

beforeEach(() => {
  backend.activeAssignment = buildAssignment();
  backend.interruptedSession = null;
  backend.recentSessions = [];
  backend.createdSessions = [];
  backend.savedSessions = [];
  backend.updatedAssignments = [];

  useActiveSessionStore.getState().leaveSession();
});

describe('opening a session', () => {
  it('starts on the warm-up rather than on the first exercise', async () => {
    renderScreen();

    expect(await screen.findByRole('button', { name: /i.m warm/i })).toBeInTheDocument();
  });

  it('names the session and where it sits in the programme', async () => {
    renderScreen();

    expect(
      await screen.findByRole('heading', { name: 'Legs & Pull', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/week 2/i)).toBeInTheDocument();
  });

  it('creates the programme assignment for somebody who has never trained', async () => {
    backend.activeAssignment = null;

    renderScreen();

    // Week 1 is the calibration week, which is what a brand new account gets.
    expect(
      await screen.findByRole('heading', { name: 'Legs & Pull', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/week 1/i)).toBeInTheDocument();
  });
});

describe('working through an exercise', () => {
  it('goes warm-up, brief, set, logging, rest', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    expect(await screen.findByRole('heading', { name: /goblet squat/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start set 1/i }));
    expect(await screen.findByRole('button', { name: /set done/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /set done/i }));
    expect(await screen.findByRole('heading', { name: /how did that go/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /log it/i }));
    expect(await screen.findByText(/rest left/i)).toBeInTheDocument();
  });

  it('prefills the set with what was prescribed', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    await user.click(await screen.findByRole('button', { name: /start set 1/i }));
    await user.click(screen.getByRole('button', { name: /set done/i }));

    // The goblet squat starts at 10 kg for 8 to 10 reps.
    expect(await screen.findByText('Asked for 10 kg')).toBeInTheDocument();
    expect(screen.getByText('Asked for 10')).toBeInTheDocument();
  });

  it('offers the second set after the rest', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    await user.click(await screen.findByRole('button', { name: /start set 1/i }));
    await user.click(screen.getByRole('button', { name: /set done/i }));
    await user.click(screen.getByRole('button', { name: /log it/i }));
    await user.click(await screen.findByRole('button', { name: /skip the rest|ready/i }));

    expect(await screen.findByText('Set 2 of 2')).toBeInTheDocument();
  });

  it('writes the session as soon as the first exercise is opened', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    await user.click(await screen.findByRole('button', { name: /start set 1/i }));

    await waitFor(() => {
      expect(backend.createdSessions).toHaveLength(1);
    });
  });
});

describe('a set that caused sharp pain', () => {
  it('moves on to the next exercise rather than offering another set of it', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    await user.click(await screen.findByRole('button', { name: /start set 1/i }));
    await user.click(screen.getByRole('button', { name: /set done/i }));
    await user.click(screen.getByRole('button', { name: /sharp or joint pain/i }));
    await user.click(screen.getByRole('button', { name: /log it/i }));

    // The rest still happens; what changes is what it leads to.
    await user.click(await screen.findByRole('button', { name: /skip the rest|ready/i }));

    expect(await screen.findByRole('heading', { name: /low row/i })).toBeInTheDocument();
    expect(screen.getByText('Exercise 2 of 6')).toBeInTheDocument();
  });
});

describe('skipping an exercise', () => {
  it('moves straight to the next one', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    await user.click(await screen.findByRole('button', { name: /skip this exercise/i }));

    expect(await screen.findByRole('heading', { name: /low row/i })).toBeInTheDocument();
  });
});

describe('finishing early', () => {
  it('records what was done rather than throwing it away', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    await user.click(await screen.findByRole('button', { name: /start set 1/i }));
    await user.click(screen.getByRole('button', { name: /set done/i }));
    await user.click(screen.getByRole('button', { name: /log it/i }));

    await user.click(await screen.findByRole('button', { name: /leave this session/i }));
    await user.click(screen.getByRole('button', { name: /finish here instead/i }));

    expect(
      await screen.findByRole('heading', { name: /that.s the work done/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Goblet Squat')).toBeInTheDocument();
  });

  it('saves the session and moves the programme on when it is finished', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    await user.click(await screen.findByRole('button', { name: /start set 1/i }));
    await user.click(screen.getByRole('button', { name: /set done/i }));
    await user.click(screen.getByRole('button', { name: /log it/i }));

    await user.click(await screen.findByRole('button', { name: /leave this session/i }));
    await user.click(screen.getByRole('button', { name: /finish here instead/i }));
    await user.click(await screen.findByRole('button', { name: /finish the session/i }));

    expect(await screen.findByRole('heading', { name: /legs & pull done/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(backend.updatedAssignments).toHaveLength(1);
    });

    // Session A was finished, so B is next and the week has not rolled over.
    expect(backend.updatedAssignments[0]).toMatchObject({
      nextSessionLetter: 'B',
      currentWeekNumber: 2,
    });
  });
});

describe('a session the phone interrupted', () => {
  it('picks up at the exercise that still owes sets, and says so', async () => {
    backend.interruptedSession = {
      documentId: 'session-1',
      programAssignmentId: 'assignment-1',
      sessionLetter: 'A',
      phaseNumber: 1,
      weekNumber: 2,
      startedAt: new Date('2026-09-02T09:00:00.000Z'),
      completedAt: null,
      status: 'inProgress',
      performedExercises: [
        buildLoggedExercise({
          exerciseId: 'gobletSquatToBox',
          performedSets: [buildLoggedSet(), buildLoggedSet({ setNumber: 2 })],
        }),
      ],
      totalVolumeKilograms: 240,
      durationSeconds: null,
      sessionNotes: null,
      overallFeeling: null,
    };

    renderScreen();

    expect(await screen.findByRole('heading', { name: /low row/i })).toBeInTheDocument();
    expect(screen.getByText(/picked up where you left off/i)).toBeInTheDocument();
  });

  it('never asks him to warm up again', async () => {
    backend.interruptedSession = {
      documentId: 'session-1',
      programAssignmentId: 'assignment-1',
      sessionLetter: 'A',
      phaseNumber: 1,
      weekNumber: 2,
      startedAt: new Date('2026-09-02T09:00:00.000Z'),
      completedAt: null,
      status: 'inProgress',
      performedExercises: [
        buildLoggedExercise({ exerciseId: 'gobletSquatToBox', performedSets: [buildLoggedSet()] }),
      ],
      totalVolumeKilograms: 120,
      durationSeconds: null,
      sessionNotes: null,
      overallFeeling: null,
    };

    renderScreen();

    expect(await screen.findByRole('heading', { name: /goblet squat/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /i.m warm/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start set 2/i })).toBeInTheDocument();
  });
});

describe('the calibration week', () => {
  it('explains itself instead of pretending the weight means something', async () => {
    backend.activeAssignment = buildAssignment({ currentWeekNumber: 1 });

    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);

    expect(await screen.findByText(/we.re finding your starting line/i)).toBeInTheDocument();
  });

  it('says nothing of the kind once the calibration week is over', async () => {
    const user = userEvent.setup();
    renderScreen();

    await finishTheWarmup(user);
    await screen.findByRole('heading', { name: /goblet squat/i });

    expect(screen.queryByText(/we.re finding your starting line/i)).not.toBeInTheDocument();
  });
});
