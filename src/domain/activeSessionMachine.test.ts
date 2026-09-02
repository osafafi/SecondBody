import { describe, expect, it } from 'vitest';

import {
  buildLoggedExercise,
  buildLoggedSet,
  buildPlannedExercise,
  buildPlannedSession,
} from '@/test/trainingTestFactories';
import type { PerformedSet } from '@/types/trainingHistoryTypes';

import {
  applyActiveSessionEvent,
  createInitialActiveSessionState,
  findCurrentPlannedExercise,
  findLoggedExercise,
  resumeActiveSessionState,
  type ActiveSessionEvent,
  type ActiveSessionState,
} from './activeSessionMachine';
import type { PlannedSession } from './sessionPlanning';

const NINE_IN_THE_MORNING = new Date('2026-09-02T09:00:00.000Z');
const NINE_OH_TWO = new Date('2026-09-02T09:02:00.000Z');

/** Two exercises of two sets each, which is enough to reach every transition. */
function buildTwoExerciseSession(): PlannedSession {
  return buildPlannedSession({
    exercises: [
      buildPlannedExercise({ orderIndex: 1, exerciseId: 'gobletSquatToBox' }),
      buildPlannedExercise({ orderIndex: 2, exerciseId: 'seatedCableRow' }),
    ],
  });
}

/** Replays a run of events, which is how a transition test reads best. */
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

function buildSet(overrides: Partial<PerformedSet> = {}): PerformedSet {
  return buildLoggedSet(overrides);
}

const WARMUP_THEN_FIRST_SET: ActiveSessionEvent[] = [
  { kind: 'warmupFinished' },
  { kind: 'exerciseStarted' },
  { kind: 'setFinished' },
];

describe('the phases a session moves through', () => {
  it('starts in the warm-up with nothing logged', () => {
    const state = createInitialActiveSessionState();

    expect(state.phase).toBe('warmingUp');
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.currentSetNumber).toBe(1);
    expect(state.loggedExercises).toEqual([]);
  });

  it('hands over from the warm-up to the first exercise brief', () => {
    const state = replay(buildTwoExerciseSession(), [{ kind: 'warmupFinished' }]);

    expect(state.phase).toBe('exerciseBrief');
  });

  it('goes brief, set, logging', () => {
    const plannedSession = buildTwoExerciseSession();

    expect(replay(plannedSession, [{ kind: 'warmupFinished' }]).phase).toBe('exerciseBrief');
    expect(
      replay(plannedSession, [{ kind: 'warmupFinished' }, { kind: 'exerciseStarted' }]).phase,
    ).toBe('setInProgress');
    expect(replay(plannedSession, WARMUP_THEN_FIRST_SET).phase).toBe('loggingSet');
  });

  it('rests between two sets of the same exercise', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
    ]);

    expect(state.phase).toBe('resting');
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.currentSetNumber).toBe(2);
    expect(state.restStartedAt).toEqual(NINE_IN_THE_MORNING);
    expect(state.restTargetSeconds).toBe(90);
  });

  it('extends the rest without restarting it', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restExtended', extraSeconds: 30 },
    ]);

    expect(state.restTargetSeconds).toBe(120);
    expect(state.restStartedAt).toEqual(NINE_IN_THE_MORNING);
  });

  it('returns to the set itself when the rest was between two sets', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
    ]);

    expect(state.phase).toBe('setInProgress');
    expect(state.currentSetNumber).toBe(2);
  });

  it('rests between two exercises, then shows the next brief', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_IN_THE_MORNING },
      { kind: 'setFinished' },
      { kind: 'setLogged', performedSet: buildSet({ setNumber: 2 }), occurredAt: NINE_OH_TWO },
    ]);

    expect(state.phase).toBe('resting');
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.currentSetNumber).toBe(1);

    const afterRest = applyActiveSessionEvent(
      state,
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
      buildTwoExerciseSession(),
    );

    expect(afterRest.phase).toBe('exerciseBrief');
  });

  it('goes to the review after the last set of the last exercise, with no rest first', () => {
    const plannedSession = buildPlannedSession({
      exercises: [buildPlannedExercise({ workingSetCount: 1 })],
    });

    const state = replay(plannedSession, [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
    ]);

    expect(state.phase).toBe('sessionReview');
    expect(findCurrentPlannedExercise(state, plannedSession)).toBeNull();
  });

  it('finishes a plan with no exercises in it rather than pointing at nothing', () => {
    const state = replay(buildPlannedSession({ exercises: [] }), [{ kind: 'warmupFinished' }]);

    expect(state.phase).toBe('sessionReview');
  });
});

describe('logging what happened', () => {
  it('records the set against the exercise it belongs to', () => {
    const performedSet = buildSet({ actualReps: 11, effortRating: 'easy' });

    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet, occurredAt: NINE_IN_THE_MORNING },
    ]);

    expect(state.loggedExercises).toHaveLength(1);
    expect(state.loggedExercises[0]?.exerciseId).toBe('gobletSquatToBox');
    expect(state.loggedExercises[0]?.performedSets).toEqual([performedSet]);
  });

  it('creates the log entry as soon as an exercise is started, not when it is planned', () => {
    const state = replay(buildTwoExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseStarted' },
    ]);

    expect(state.loggedExercises).toHaveLength(1);
    expect(state.loggedExercises[0]?.performedSets).toEqual([]);
    expect(state.loggedExercises[0]?.wasSkipped).toBe(false);
  });

  it('measures the rest that was actually taken before the next set', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
    ]);

    expect(state.restSecondsBeforeCurrentSet).toBe(120);
  });

  it('has no rest to report before the first set of an exercise', () => {
    const state = replay(buildTwoExerciseSession(), WARMUP_THEN_FIRST_SET);

    expect(state.restSecondsBeforeCurrentSet).toBeNull();
  });
});

describe('sharp pain ends that exercise for the day', () => {
  it('moves on rather than prescribing another set of the movement that hurt', () => {
    const plannedSession = buildTwoExerciseSession();

    const state = replay(plannedSession, [
      ...WARMUP_THEN_FIRST_SET,
      {
        kind: 'setLogged',
        performedSet: buildSet({ didCauseSharpPain: true }),
        occurredAt: NINE_IN_THE_MORNING,
      },
    ]);

    // Set 2 of the squat is not offered. The rest leads into the next exercise.
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.currentSetNumber).toBe(1);
    expect(state.phase).toBe('resting');
  });

  it('keeps the set that hurt, because progression needs to see it', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      {
        kind: 'setLogged',
        performedSet: buildSet({ didCauseSharpPain: true }),
        occurredAt: NINE_IN_THE_MORNING,
      },
    ]);

    expect(state.loggedExercises[0]?.performedSets).toHaveLength(1);
    expect(state.loggedExercises[0]?.performedSets[0]?.didCauseSharpPain).toBe(true);
    expect(state.loggedExercises[0]?.wasSkipped).toBe(false);
  });

  it('ends the session when the movement that hurt was the last one', () => {
    const state = replay(buildPlannedSession(), [
      ...WARMUP_THEN_FIRST_SET,
      {
        kind: 'setLogged',
        performedSet: buildSet({ didCauseSharpPain: true }),
        occurredAt: NINE_IN_THE_MORNING,
      },
    ]);

    expect(state.phase).toBe('sessionReview');
  });
});

describe('skipping an exercise', () => {
  it('records the skip and its reason, and moves on', () => {
    const state = replay(buildTwoExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseSkipped', skipReason: 'Someone was on it' },
    ]);

    expect(state.loggedExercises[0]?.wasSkipped).toBe(true);
    expect(state.loggedExercises[0]?.skipReason).toBe('Someone was on it');
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.phase).toBe('exerciseBrief');
  });

  it('can be skipped part way through, keeping the sets already done', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
      { kind: 'exerciseSkipped', skipReason: null },
    ]);

    expect(state.loggedExercises[0]?.performedSets).toHaveLength(1);
    expect(state.loggedExercises[0]?.wasSkipped).toBe(true);
    expect(state.currentExerciseIndex).toBe(1);
  });

  it('cannot be skipped from the rest timer, which belongs to no exercise in particular', () => {
    const restingState = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
    ]);

    const afterSkip = applyActiveSessionEvent(
      restingState,
      { kind: 'exerciseSkipped', skipReason: null },
      buildTwoExerciseSession(),
    );

    expect(afterSkip).toBe(restingState);
  });
});

describe('ending a session early', () => {
  it('goes to the review from the middle of an exercise', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
      { kind: 'sessionEndedEarly' },
    ]);

    expect(state.phase).toBe('sessionReview');
  });

  it('keeps everything already logged', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'sessionEndedEarly' },
    ]);

    expect(state.loggedExercises[0]?.performedSets).toHaveLength(1);
  });

  it('leaves the exercises never reached out of the log rather than marking them skipped', () => {
    const state = replay(buildTwoExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'sessionEndedEarly' },
    ]);

    expect(state.loggedExercises).toEqual([]);
  });

  it('does nothing once the session is already finished', () => {
    const completed = replay(
      buildPlannedSession({ exercises: [buildPlannedExercise({ workingSetCount: 1 })] }),
      [
        ...WARMUP_THEN_FIRST_SET,
        { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
        { kind: 'sessionFinished' },
      ],
    );

    expect(
      applyActiveSessionEvent(completed, { kind: 'sessionEndedEarly' }, buildPlannedSession()),
    ).toBe(completed);
  });
});

describe('the review at the end', () => {
  const reachReview = (): ActiveSessionState =>
    replay(buildPlannedSession({ exercises: [buildPlannedExercise({ workingSetCount: 1 })] }), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
    ]);

  it('records how the session felt', () => {
    const state = applyActiveSessionEvent(
      reachReview(),
      { kind: 'overallFeelingChosen', overallFeeling: 'strong' },
      buildPlannedSession(),
    );

    expect(state.overallFeeling).toBe('strong');
  });

  it('treats a note of nothing but spaces as no note at all', () => {
    const state = applyActiveSessionEvent(
      reachReview(),
      { kind: 'sessionNotesEdited', sessionNotes: '   ' },
      buildPlannedSession(),
    );

    expect(state.sessionNotes).toBeNull();
  });

  it('trims a real note', () => {
    const state = applyActiveSessionEvent(
      reachReview(),
      { kind: 'sessionNotesEdited', sessionNotes: '  Knee felt better today  ' },
      buildPlannedSession(),
    );

    expect(state.sessionNotes).toBe('Knee felt better today');
  });

  it('completes', () => {
    const state = applyActiveSessionEvent(
      reachReview(),
      { kind: 'sessionFinished' },
      buildPlannedSession(),
    );

    expect(state.phase).toBe('completed');
  });
});

describe('events that do not belong to the current phase', () => {
  it('are ignored rather than throwing, because gym taps are not careful', () => {
    const plannedSession = buildTwoExerciseSession();
    const warmingUp = createInitialActiveSessionState();

    const impossibleEvents: ActiveSessionEvent[] = [
      { kind: 'setFinished' },
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_IN_THE_MORNING },
      { kind: 'overallFeelingChosen', overallFeeling: 'rough' },
      { kind: 'sessionFinished' },
    ];

    for (const event of impossibleEvents) {
      expect(applyActiveSessionEvent(warmingUp, event, plannedSession)).toBe(warmingUp);
    }
  });

  it('ignores a second warm-up finish, so a double tap does not skip an exercise', () => {
    const plannedSession = buildTwoExerciseSession();
    const afterFirstTap = replay(plannedSession, [{ kind: 'warmupFinished' }]);
    const afterSecondTap = applyActiveSessionEvent(
      afterFirstTap,
      { kind: 'warmupFinished' },
      plannedSession,
    );

    expect(afterSecondTap).toBe(afterFirstTap);
  });
});

describe('resuming a session the phone interrupted', () => {
  it('picks up at the brief of the exercise that still owes sets', () => {
    const plannedSession = buildTwoExerciseSession();

    const state = resumeActiveSessionState(plannedSession, [
      buildLoggedExercise({
        exerciseId: 'gobletSquatToBox',
        performedSets: [buildLoggedSet(), buildLoggedSet({ setNumber: 2 })],
      }),
      buildLoggedExercise({ exerciseId: 'seatedCableRow', performedSets: [buildLoggedSet()] }),
    ]);

    expect(state.phase).toBe('exerciseBrief');
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.currentSetNumber).toBe(2);
  });

  it('never sends him back to the warm-up he has already done', () => {
    const state = resumeActiveSessionState(buildTwoExerciseSession(), [
      buildLoggedExercise({ exerciseId: 'gobletSquatToBox', performedSets: [buildLoggedSet()] }),
    ]);

    expect(state.phase).not.toBe('warmingUp');
  });

  it('does not re-offer an exercise that was skipped', () => {
    const state = resumeActiveSessionState(buildTwoExerciseSession(), [
      buildLoggedExercise({
        exerciseId: 'gobletSquatToBox',
        performedSets: [],
        wasSkipped: true,
      }),
    ]);

    expect(state.currentExerciseIndex).toBe(1);
  });

  it('does not re-offer an exercise that was stopped for sharp pain', () => {
    const state = resumeActiveSessionState(buildTwoExerciseSession(), [
      buildLoggedExercise({
        exerciseId: 'gobletSquatToBox',
        performedSets: [buildLoggedSet({ didCauseSharpPain: true })],
      }),
    ]);

    expect(state.currentExerciseIndex).toBe(1);
  });

  it('goes straight to the review when everything was already done', () => {
    const plannedSession = buildPlannedSession({
      exercises: [buildPlannedExercise({ workingSetCount: 1 })],
    });

    const state = resumeActiveSessionState(plannedSession, [
      buildLoggedExercise({ performedSets: [buildLoggedSet()] }),
    ]);

    expect(state.phase).toBe('sessionReview');
  });

  it('keeps everything that was already logged', () => {
    const loggedExercises = [
      buildLoggedExercise({ exerciseId: 'gobletSquatToBox', performedSets: [buildLoggedSet()] }),
    ];

    const state = resumeActiveSessionState(buildTwoExerciseSession(), loggedExercises);

    expect(state.loggedExercises).toEqual(loggedExercises);
  });
});

describe('putting an exercise aside because the machine is busy', () => {
  /** Three exercises of one set each, so the queue has somewhere to go. */
  function buildThreeExerciseSession(): PlannedSession {
    return buildPlannedSession({
      exercises: [
        buildPlannedExercise({ orderIndex: 1, exerciseId: 'gobletSquatToBox', workingSetCount: 1 }),
        buildPlannedExercise({ orderIndex: 2, exerciseId: 'seatedCableRow', workingSetCount: 1 }),
        buildPlannedExercise({ orderIndex: 3, exerciseId: 'legExtension', workingSetCount: 1 }),
      ],
    });
  }

  it('moves on to the next exercise without recording anything', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseParked' },
    ]);

    expect(state.phase).toBe('exerciseBrief');
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.loggedExercises).toEqual([]);
  });

  it('remembers what is waiting on a machine', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseParked' },
    ]);

    expect(state.parkedExerciseIds).toEqual(['gobletSquatToBox']);
  });

  it('offers the parked exercise again once everything else is done', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      // The squat machine is busy, so the row and the leg extension happen first.
      { kind: 'exerciseParked' },
      { kind: 'exerciseStarted' },
      { kind: 'setFinished' },
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
      { kind: 'exerciseStarted' },
      { kind: 'setFinished' },
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
    ]);

    expect(state.phase).toBe('exerciseBrief');
    expect(state.currentExerciseIndex).toBe(0);
  });

  it('does not hand the same exercise straight back when it is the only one left', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'exerciseParked' },
    ]);

    expect(state.phase).toBe('sessionReview');
  });

  it('records a machine that never freed up as a skip, with the reason', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseParked' },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'exerciseSkipped', skipReason: null },
      // Offered again at the end, and it is still occupied. That ends the session.
      { kind: 'exerciseParked' },
      { kind: 'sessionFinished' },
    ]);

    expect(state.phase).toBe('completed');

    const squat = findLoggedExercise(state, 'gobletSquatToBox');

    expect(squat?.wasSkipped).toBe(true);
    expect(squat?.skipReason).toContain('machine was busy');
  });

  it('leaves a parked exercise alone once it has been come back to and finished', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseParked' },
      { kind: 'exerciseSelected', exerciseIndex: 0 },
      { kind: 'exerciseStarted' },
      { kind: 'setFinished' },
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'sessionFinished' },
    ]);

    const squat = findLoggedExercise(state, 'gobletSquatToBox');

    expect(squat?.wasSkipped).toBe(false);
    expect(squat?.performedSets).toHaveLength(1);
  });

  it('ignores parking while a set is being written down', () => {
    const plannedSession = buildThreeExerciseSession();
    const beforeParking = replay(plannedSession, WARMUP_THEN_FIRST_SET);

    expect(replay(plannedSession, [{ kind: 'exerciseParked' }], beforeParking)).toBe(beforeParking);
  });
});

describe('choosing an exercise from the session board', () => {
  function buildThreeExerciseSession(): PlannedSession {
    return buildPlannedSession({
      exercises: [
        buildPlannedExercise({ orderIndex: 1, exerciseId: 'gobletSquatToBox' }),
        buildPlannedExercise({ orderIndex: 2, exerciseId: 'seatedCableRow' }),
        buildPlannedExercise({ orderIndex: 3, exerciseId: 'legExtension' }),
      ],
    });
  }

  it('jumps to the chosen movement and shows its brief', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseSelected', exerciseIndex: 2 },
    ]);

    expect(state.phase).toBe('exerciseBrief');
    expect(state.currentExerciseIndex).toBe(2);
    expect(state.currentSetNumber).toBe(1);
  });

  it('picks up at the set that is actually owed, not back at set 1', () => {
    const state = replay(buildThreeExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
      // Off to the leg extension mid-exercise, then back to the squat.
      { kind: 'exerciseSelected', exerciseIndex: 2 },
      { kind: 'exerciseSelected', exerciseIndex: 0 },
    ]);

    expect(state.currentExerciseIndex).toBe(0);
    expect(state.currentSetNumber).toBe(2);
  });

  it('reverses a skip, because walking back over to it is the decision', () => {
    const state = replay(buildThreeExerciseSession(), [
      { kind: 'warmupFinished' },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'exerciseSelected', exerciseIndex: 0 },
    ]);

    expect(findLoggedExercise(state, 'gobletSquatToBox')?.wasSkipped).toBe(false);
    expect(state.currentExerciseIndex).toBe(0);
  });

  it('refuses an exercise that is already finished', () => {
    const plannedSession = buildPlannedSession({
      exercises: [
        buildPlannedExercise({ orderIndex: 1, exerciseId: 'gobletSquatToBox', workingSetCount: 1 }),
        buildPlannedExercise({ orderIndex: 2, exerciseId: 'seatedCableRow', workingSetCount: 1 }),
      ],
    });

    const afterFirstExercise = replay(plannedSession, [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
    ]);

    expect(
      replay(plannedSession, [{ kind: 'exerciseSelected', exerciseIndex: 0 }], afterFirstExercise),
    ).toBe(afterFirstExercise);
  });

  it('refuses an exercise that was stopped for sharp pain', () => {
    const plannedSession = buildThreeExerciseSession();

    const afterPain = replay(plannedSession, [
      ...WARMUP_THEN_FIRST_SET,
      {
        kind: 'setLogged',
        performedSet: buildSet({ didCauseSharpPain: true }),
        occurredAt: NINE_IN_THE_MORNING,
      },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
    ]);

    expect(
      replay(plannedSession, [{ kind: 'exerciseSelected', exerciseIndex: 0 }], afterPain),
    ).toBe(afterPain);
  });

  it('is ignored during the warm-up, which is training rather than a menu', () => {
    const plannedSession = buildThreeExerciseSession();
    const atTheWarmup = createInitialActiveSessionState();

    expect(
      replay(plannedSession, [{ kind: 'exerciseSelected', exerciseIndex: 1 }], atTheWarmup),
    ).toBe(atTheWarmup);
  });

  it('sends the session back out of the review when a machine finally frees up', () => {
    const plannedSession = buildThreeExerciseSession();

    const atTheReview = replay(plannedSession, [
      { kind: 'warmupFinished' },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'exerciseSkipped', skipReason: null },
      { kind: 'exerciseSkipped', skipReason: null },
    ]);

    expect(atTheReview.phase).toBe('sessionReview');

    const state = replay(
      plannedSession,
      [{ kind: 'exerciseSelected', exerciseIndex: 1 }],
      atTheReview,
    );

    expect(state.phase).toBe('exerciseBrief');
    expect(state.currentExerciseIndex).toBe(1);
  });
});

describe('where a rest leads', () => {
  it('ends at the next set of the same movement', () => {
    const state = replay(buildTwoExerciseSession(), [
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
    ]);

    expect(state.phase).toBe('setInProgress');
  });

  it('ends at the brief of a half-finished movement it has come back to', () => {
    const plannedSession = buildPlannedSession({
      exercises: [
        buildPlannedExercise({ orderIndex: 1, exerciseId: 'gobletSquatToBox', workingSetCount: 2 }),
        buildPlannedExercise({ orderIndex: 2, exerciseId: 'seatedCableRow', workingSetCount: 1 }),
      ],
    });

    const state = replay(plannedSession, [
      // One set of the squat, then park it and finish the row.
      ...WARMUP_THEN_FIRST_SET,
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
      { kind: 'exerciseParked' },
      { kind: 'exerciseStarted' },
      { kind: 'setFinished' },
      { kind: 'setLogged', performedSet: buildSet(), occurredAt: NINE_IN_THE_MORNING },
      { kind: 'restFinished', occurredAt: NINE_OH_TWO },
    ]);

    /*
     * The squat is owed its second set, so the set number is 2 — which is what
     * the old "set 1 means a new exercise" rule read as "carry on mid-exercise",
     * dropping him into a set of a movement he had not been shown.
     */
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.currentSetNumber).toBe(2);
    expect(state.phase).toBe('exerciseBrief');
  });
});
