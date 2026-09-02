import { describe, expect, it } from 'vitest';

import {
  buildLoggedExercise,
  buildLoggedSet,
  buildPlannedExercise,
  buildPlannedSession,
} from '@/test/trainingTestFactories';

import {
  applyActiveSessionEvent,
  createInitialActiveSessionState,
  type ActiveSessionEvent,
  type ActiveSessionState,
} from './activeSessionMachine';
import { buildSessionBoard, countSessionBoardEntriesLeft } from './sessionBoard';
import type { PlannedSession } from './sessionPlanning';

function buildThreeExerciseSession(): PlannedSession {
  return buildPlannedSession({
    exercises: [
      buildPlannedExercise({ orderIndex: 1, exerciseId: 'gobletSquatToBox', workingSetCount: 2 }),
      buildPlannedExercise({ orderIndex: 2, exerciseId: 'seatedCableRow', workingSetCount: 2 }),
      buildPlannedExercise({ orderIndex: 3, exerciseId: 'legExtension', workingSetCount: 2 }),
    ],
  });
}

function replay(
  plannedSession: PlannedSession,
  events: ActiveSessionEvent[],
  initialState: ActiveSessionState = createInitialActiveSessionState(),
): ActiveSessionState {
  return events.reduce(
    (state, event) => applyActiveSessionEvent(state, event, plannedSession),
    initialState,
  );
}

describe('what state the board shows each movement in', () => {
  it('starts with everything not started', () => {
    const entries = buildSessionBoard(
      createInitialActiveSessionState(),
      buildThreeExerciseSession(),
    );

    expect(entries.map((entry) => entry.status)).toEqual([
      'notStarted',
      'notStarted',
      'notStarted',
    ]);
  });

  it('marks a movement with sets against it and more owed as in progress', () => {
    const state: ActiveSessionState = {
      ...createInitialActiveSessionState(),
      loggedExercises: [
        buildLoggedExercise({ exerciseId: 'gobletSquatToBox', performedSets: [buildLoggedSet()] }),
      ],
    };

    const entries = buildSessionBoard(state, buildThreeExerciseSession());

    expect(entries[0]?.status).toBe('inProgress');
    expect(entries[0]?.loggedSetCount).toBe(1);
  });

  it('marks a movement with every set in as done', () => {
    const state: ActiveSessionState = {
      ...createInitialActiveSessionState(),
      loggedExercises: [
        buildLoggedExercise({
          exerciseId: 'gobletSquatToBox',
          performedSets: [buildLoggedSet({ setNumber: 1 }), buildLoggedSet({ setNumber: 2 })],
        }),
      ],
    };

    expect(buildSessionBoard(state, buildThreeExerciseSession())[0]?.status).toBe('done');
  });

  it('marks a movement stopped by sharp pain as done rather than as owed', () => {
    const state: ActiveSessionState = {
      ...createInitialActiveSessionState(),
      loggedExercises: [
        buildLoggedExercise({
          exerciseId: 'gobletSquatToBox',
          performedSets: [buildLoggedSet({ didCauseSharpPain: true })],
        }),
      ],
    };

    const entry = buildSessionBoard(state, buildThreeExerciseSession())[0];

    expect(entry?.status).toBe('done');
    expect(entry?.canBeReturnedTo).toBe(false);
  });

  it('marks a parked movement as waiting on a machine', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseParked' },
    ]);

    const entries = buildSessionBoard(state, buildThreeExerciseSession());

    expect(entries[0]?.status).toBe('waitingOnMachine');
    expect(entries[0]?.canBeReturnedTo).toBe(true);
  });

  it('calls a finished movement done even though it was parked on the way', () => {
    const plannedSession = buildPlannedSession({
      exercises: [buildPlannedExercise({ exerciseId: 'gobletSquatToBox', workingSetCount: 1 })],
    });

    const state: ActiveSessionState = {
      ...replay(plannedSession, [{ kind: 'warmupFinished' }, { kind: 'exerciseParked' }]),
      loggedExercises: [
        buildLoggedExercise({ exerciseId: 'gobletSquatToBox', performedSets: [buildLoggedSet()] }),
      ],
    };

    expect(buildSessionBoard(state, plannedSession)[0]?.status).toBe('done');
  });

  it('shows a skipped movement as skipped, and still lets him go back to it', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseSkipped', skipReason: null },
    ]);

    const entries = buildSessionBoard(state, buildThreeExerciseSession());

    expect(entries[0]?.status).toBe('skipped');
    expect(entries[0]?.canBeReturnedTo).toBe(true);
  });
});

describe('which card the session is standing on', () => {
  it('marks the movement the session is on', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseSelected', exerciseIndex: 2 },
    ]);

    expect(
      buildSessionBoard(state, buildThreeExerciseSession()).map((entry) => entry.isCurrent),
    ).toEqual([false, false, true]);
  });

  it('offers nothing to tap during the warm-up', () => {
    const entries = buildSessionBoard(
      createInitialActiveSessionState(),
      buildThreeExerciseSession(),
    );

    expect(entries.every((entry) => !entry.canBeReturnedTo)).toBe(true);
  });
});

describe('how much of the session is left', () => {
  it('counts everything that is neither done nor skipped', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'exerciseParked' },
    ]);

    const entries = buildSessionBoard(state, buildThreeExerciseSession());

    // The row is parked and the leg extension is untouched. Both still count.
    expect(countSessionBoardEntriesLeft(entries)).toBe(2);
  });
});
