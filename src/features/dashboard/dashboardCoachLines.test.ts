import { describe, expect, it } from 'vitest';

import { allCoachLines } from '@/content/coachVoice/allCoachLines';

import { selectDailyCoachLine, type DailyCoachLineInput } from './dashboardCoachLines';

function buildInput(overrides: Partial<DailyCoachLineInput> = {}): DailyCoachLineInput {
  return {
    stance: 'readyToTrain',
    isReturningFromLayoff: false,
    hasMissedAPlannedSession: false,
    isDeloadWeekDue: false,
    isFirstSessionOfPhaseDue: false,
    currentWeekNumber: 6,
    configuredVerbosity: 'standard',
    rotationIndex: 0,
    ...overrides,
  };
}

describe('selectDailyCoachLine', () => {
  it('says nothing on an ordinary training day', () => {
    expect(selectDailyCoachLine(buildInput())).toBeNull();
  });

  it('returns a line that was actually written for the moment', () => {
    const line = selectDailyCoachLine(buildInput({ isReturningFromLayoff: true }));

    const layoffLines = allCoachLines
      .filter((coachLine) => coachLine.category === 'returningFromLayoff')
      .map((coachLine) => coachLine.text);

    expect(line).not.toBeNull();
    expect(layoffLines).toContain(line);
  });

  it('rotates across days rather than repeating', () => {
    const firstDay = selectDailyCoachLine(
      buildInput({ hasMissedAPlannedSession: true, rotationIndex: 0 }),
    );
    const nextDay = selectDailyCoachLine(
      buildInput({ hasMissedAPlannedSession: true, rotationIndex: 1 }),
    );

    expect(firstDay).not.toBe(nextDay);
  });

  it('honours a minimal verbosity setting', () => {
    /*
     * The `sessionMissed` lines are written at all three verbosities. At
     * `minimal` only the quietest is eligible, so the rotation cannot reach the
     * others however far it counts.
     */
    const linesAtMinimal = [0, 1, 2, 3].map((rotationIndex) =>
      selectDailyCoachLine(
        buildInput({
          hasMissedAPlannedSession: true,
          configuredVerbosity: 'minimal',
          rotationIndex,
        }),
      ),
    );

    expect(new Set(linesAtMinimal).size).toBe(1);
  });

  it('never spends praise, whatever the day', () => {
    const praiseLines = allCoachLines
      .filter((coachLine) => coachLine.isPraise)
      .map((coachLine) => coachLine.text);

    const everyMoment = [
      buildInput({ isReturningFromLayoff: true }),
      buildInput({ hasMissedAPlannedSession: true }),
      buildInput({ isDeloadWeekDue: true }),
      buildInput({ isFirstSessionOfPhaseDue: true }),
      buildInput({ currentWeekNumber: 2 }),
      buildInput({ stance: 'restDay' }),
    ].flatMap((input) =>
      [0, 1, 2, 3, 4].map((rotationIndex) =>
        selectDailyCoachLine({ ...input, rotationIndex, configuredVerbosity: 'detailed' }),
      ),
    );

    for (const line of everyMoment) {
      expect(praiseLines).not.toContain(line);
    }
  });
});
