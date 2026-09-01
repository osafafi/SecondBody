import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_ROUTE_PATHS, buildScheduleDayPath } from '@/app/appRoutes';
import { DEFAULT_USER_SETTINGS, type UserProfile } from '@/types/userAccountTypes';

/**
 * Firestore is mocked out entirely, for the reason `App.test.tsx` spells out:
 * there is nothing here worth testing about Firestore, and CLAUDE.md section 5
 * says so. What is worth testing is that a date in the URL turns into the right
 * one of four different screens.
 *
 * The fourth of those — a planned day — is the one this feature was asked for
 * and the one with a real rule behind it: **no weight may appear on it.** Every
 * number that goes on a bar is decided when the session opens, and one shown a
 * day early is a guess that has already changed.
 *
 * `vi.hoisted` because `vi.mock` factories are lifted above the imports.
 */
const backend = vi.hoisted(() => ({
  storedAssignment: null as unknown,
  storedSessions: [] as unknown[],
}));

vi.mock('@/app/useAuthentication', () => ({
  useAuthentication: () => ({ signedInUser: { userId: 'user-1', displayName: 'Omar' } }),
}));

vi.mock('@/app/useUserProfile', () => ({
  useUserProfile: () => ({ userProfile: buildProfile(), profileStatus: 'ready' }),
}));

vi.mock('@/services/repositories/programAssignmentRepository', () => ({
  readActiveProgramAssignment: () => Promise.resolve(backend.storedAssignment),
}));

vi.mock('@/services/repositories/workoutSessionRepository', () => ({
  readRecentWorkoutSessions: () => Promise.resolve(backend.storedSessions),
}));

vi.mock('@/services/repositories/userSettingsRepository', () => ({
  readUserSettings: () => Promise.resolve({ ...DEFAULT_USER_SETTINGS, updatedAt: new Date() }),
}));

const { SessionDetailScreen } = await import('./SessionDetailScreen');
const { buildWorkoutSession, buildLoggedExercise, buildLoggedSet } =
  await import('@/test/trainingTestFactories');

/*
 * Wednesday 2 September 2026, the day the first real session was due. Written
 * without a timezone so it parses as local time and is a Wednesday on a CI
 * runner in UTC and on a laptop in UTC+3 alike — the trap `App.test.tsx`
 * documents.
 */
const WEDNESDAY_2_SEPTEMBER = new Date('2026-09-02T09:00:00');

function buildProfile(): UserProfile {
  return {
    displayName: 'Omar',
    birthYear: 1990,
    heightCentimetres: 178,
    startingWeightKilograms: 92,
    targetWeightKilograms: 83,
    painAreas: [],
    excludedExerciseIds: [],
    availableEquipmentIds: ['dumbbells'],
    trainingDaysOfWeek: [1, 3, 5],
    hasCompletedOnboarding: true,
    createdAt: new Date('2026-08-30T10:00:00.000Z'),
    updatedAt: new Date('2026-08-30T10:00:00.000Z'),
  };
}

function renderDay(isoDate: string) {
  return render(
    <MemoryRouter initialEntries={[buildScheduleDayPath(isoDate)]}>
      <Routes>
        <Route path={APP_ROUTE_PATHS.scheduleDay} element={<SessionDetailScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  /* Only `Date` is faked; faking timers would stop `findBy*` ever resolving. */
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(WEDNESDAY_2_SEPTEMBER);

  backend.storedAssignment = {
    programTemplateId: 'twelveWeekFoundation',
    startedOn: '2026-09-02',
    currentPhaseNumber: 1,
    currentWeekNumber: 1,
    nextSessionLetter: 'A',
    status: 'active',
    completedOn: null,
  };
  backend.storedSessions = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('a training day still to come', () => {
  it('names the session and what week it is', async () => {
    /* Friday, two days out. */
    renderDay('2026-09-04');

    expect(await screen.findByText(/week 1 of 12/i)).toBeInTheDocument();
  });

  it('lists the movements it contains', async () => {
    renderDay('2026-09-04');

    expect(await screen.findByRole('heading', { name: 'What is in it' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(1);
  });

  it('puts no weight on it, and says why', async () => {
    renderDay('2026-09-04');

    expect(await screen.findByRole('heading', { name: 'What is in it' })).toBeInTheDocument();

    /*
     * The rule this whole preview exists under. A kilogram figure anywhere on a
     * planned day is a prescription made a day early against history that has
     * not happened yet.
     */
    expect(screen.queryByText(/\d+\s*kg/)).not.toBeInTheDocument();
    expect(screen.getByText(/no weights here on purpose/i)).toBeInTheDocument();
  });

  it('offers no way to start it', async () => {
    renderDay('2026-09-04');

    expect(await screen.findByRole('heading', { name: 'What is in it' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /start/i })).not.toBeInTheDocument();
  });
});

describe('a day that was trained', () => {
  beforeEach(() => {
    backend.storedSessions = [
      buildWorkoutSession({
        sessionLetter: 'A',
        weekNumber: 1,
        phaseNumber: 1,
        startedAt: new Date('2026-08-31T17:00:00'),
        completedAt: new Date('2026-08-31T18:00:00'),
        status: 'completed',
        durationSeconds: 3120,
        totalVolumeKilograms: 3240,
        overallFeeling: 'strong',
        performedExercises: [
          buildLoggedExercise({
            exerciseId: 'legExtension',
            performedSets: [
              buildLoggedSet({ setNumber: 1, actualWeightKilograms: 30, actualReps: 12 }),
              buildLoggedSet({
                setNumber: 2,
                actualWeightKilograms: 35,
                prescribedWeightKilograms: 30,
                actualReps: 10,
                prescribedReps: 12,
                effortRating: 'brutal',
              }),
            ],
          }),
        ],
      }),
    ];
    backend.storedAssignment = {
      programTemplateId: 'twelveWeekFoundation',
      startedOn: '2026-08-31',
      currentPhaseNumber: 1,
      currentWeekNumber: 1,
      nextSessionLetter: 'B',
      status: 'active',
      completedOn: null,
    };
  });

  it('shows every set at the weight it was actually done at', async () => {
    renderDay('2026-08-31');

    expect(await screen.findByText('30 kg × 12')).toBeInTheDocument();
    expect(screen.getByText('35 kg × 10')).toBeInTheDocument();
  });

  it('says where a set went off the prescription, and only there', async () => {
    renderDay('2026-08-31');

    expect(await screen.findByText('asked for 30 kg × 12')).toBeInTheDocument();

    /* The first set went to plan, so exactly one row carries a difference. */
    expect(screen.getAllByText(/asked for/)).toHaveLength(1);
  });

  it('shows the session totals as they were stored', async () => {
    renderDay('2026-08-31');

    expect(await screen.findByText('3,240 kg')).toBeInTheDocument();
    expect(screen.getByText('52 min')).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });
});

describe('a day with nothing behind it', () => {
  it('calls a rest day a rest day', async () => {
    /* Thursday. Not one of the profile's training days. */
    renderDay('2026-09-03');

    expect(await screen.findByRole('heading', { name: 'A rest day' })).toBeInTheDocument();
  });

  it('says nothing was logged on a training day that went by', async () => {
    /* Monday 31 August: a training day, after the programme started, untrained. */
    backend.storedAssignment = {
      programTemplateId: 'twelveWeekFoundation',
      startedOn: '2026-08-24',
      currentPhaseNumber: 1,
      currentWeekNumber: 1,
      nextSessionLetter: 'A',
      status: 'active',
      completedOn: null,
    };

    renderDay('2026-08-31');

    expect(await screen.findByRole('heading', { name: 'Nothing was logged' })).toBeInTheDocument();
  });

  it('says so plainly for a date the calendar does not reach', async () => {
    renderDay('2020-01-01');

    expect(
      await screen.findByRole('heading', { name: 'Outside the calendar' }),
    ).toBeInTheDocument();
  });
});
