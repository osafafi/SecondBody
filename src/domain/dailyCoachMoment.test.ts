import { describe, expect, it } from 'vitest';

import { selectDailyCoachMoment, type DailyCoachMomentInput } from './dailyCoachMoment';

function buildInput(overrides: Partial<DailyCoachMomentInput> = {}): DailyCoachMomentInput {
  return {
    stance: 'readyToTrain',
    isReturningFromLayoff: false,
    hasMissedAPlannedSession: false,
    isDeloadWeekDue: false,
    isFirstSessionOfPhaseDue: false,
    currentWeekNumber: 6,
    ...overrides,
  };
}

describe('selectDailyCoachMoment', () => {
  it('says nothing on an ordinary training day in the middle of the programme', () => {
    expect(selectDailyCoachMoment(buildInput())).toBeNull();
  });

  it('offers the mobility routine on a rest day', () => {
    expect(selectDailyCoachMoment(buildInput({ stance: 'restDay' }))).toBe(
      'mobilityRoutineOpening',
    );
  });

  it('does not offer a stretch on the way into a squat session', () => {
    expect(selectDailyCoachMoment(buildInput({ stance: 'readyToTrain' }))).toBeNull();
  });

  it('raises the scale conversation unprompted in weeks 1 to 3', () => {
    for (const weekNumber of [1, 2, 3]) {
      expect(selectDailyCoachMoment(buildInput({ currentWeekNumber: weekNumber }))).toBe(
        'earlyScaleReassurance',
      );
    }
  });

  it('stops raising it in week 4, where it would be nagging', () => {
    expect(selectDailyCoachMoment(buildInput({ currentWeekNumber: 4 }))).toBeNull();
  });

  it('says nothing at all while a session is in progress', () => {
    expect(
      selectDailyCoachMoment(
        buildInput({
          stance: 'sessionInProgress',
          isReturningFromLayoff: true,
          hasMissedAPlannedSession: true,
        }),
      ),
    ).toBeNull();
  });

  it('says nothing when the programme is finished', () => {
    expect(
      selectDailyCoachMoment(buildInput({ stance: 'programmeFinished', currentWeekNumber: 2 })),
    ).toBeNull();
  });
});

describe('selectDailyCoachMoment ranking', () => {
  it('puts the layoff above everything else', () => {
    const moment = selectDailyCoachMoment(
      buildInput({
        isReturningFromLayoff: true,
        hasMissedAPlannedSession: true,
        isDeloadWeekDue: true,
        isFirstSessionOfPhaseDue: true,
        currentWeekNumber: 2,
      }),
    );

    expect(moment).toBe('returningFromLayoff');
  });

  it('puts a missed session above the deload and the phase', () => {
    const moment = selectDailyCoachMoment(
      buildInput({
        hasMissedAPlannedSession: true,
        isDeloadWeekDue: true,
        isFirstSessionOfPhaseDue: true,
        currentWeekNumber: 2,
      }),
    );

    expect(moment).toBe('sessionMissed');
  });

  it('puts the deload above a new phase', () => {
    const moment = selectDailyCoachMoment(
      buildInput({ isDeloadWeekDue: true, isFirstSessionOfPhaseDue: true }),
    );

    expect(moment).toBe('deloadWeekOpening');
  });

  it('puts a new phase above the week 1-3 scale reassurance', () => {
    const moment = selectDailyCoachMoment(
      buildInput({ isFirstSessionOfPhaseDue: true, currentWeekNumber: 1 }),
    );

    expect(moment).toBe('phaseOpening');
  });

  it('puts the scale reassurance above the rest-day mobility offer', () => {
    const moment = selectDailyCoachMoment(buildInput({ stance: 'restDay', currentWeekNumber: 2 }));

    expect(moment).toBe('earlyScaleReassurance');
  });

  it('still names the missed session on a rest day', () => {
    const moment = selectDailyCoachMoment(
      buildInput({ stance: 'restDay', hasMissedAPlannedSession: true }),
    );

    expect(moment).toBe('sessionMissed');
  });
});
