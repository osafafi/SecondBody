import { describe, expect, it } from 'vitest';

import { twelveWeekFoundationProgram } from '@/content/programs/twelveWeekFoundation/twelveWeekFoundationProgram';
import type { ProgramAssignment } from '@/types/trainingHistoryTypes';

import { determineLayoffAdjustment } from './layoffRecovery';
import {
  advanceProgramAssignmentAfterSession,
  createStartingProgramAssignment,
  resolveSessionStartPosition,
} from './programAssignmentProgress';

/**
 * Run against the real twelve week programme, because what is worth proving is
 * that the rules and the shipped content agree about where week 5 starts.
 */
function buildAssignment(overrides: Partial<ProgramAssignment> = {}): ProgramAssignment {
  return {
    programTemplateId: twelveWeekFoundationProgram.programTemplateId,
    startedOn: '2026-09-01',
    currentPhaseNumber: 1,
    currentWeekNumber: 1,
    nextSessionLetter: 'A',
    status: 'active',
    completedOn: null,
    ...overrides,
  };
}

describe('createStartingProgramAssignment', () => {
  it('starts at week 1, session A, in the first phase', () => {
    const assignment = createStartingProgramAssignment(twelveWeekFoundationProgram, '2026-09-01');

    expect(assignment.currentWeekNumber).toBe(1);
    expect(assignment.currentPhaseNumber).toBe(1);
    expect(assignment.nextSessionLetter).toBe('A');
    expect(assignment.status).toBe('active');
    expect(assignment.startedOn).toBe('2026-09-01');
  });
});

describe('resolveSessionStartPosition', () => {
  it('is simply what the assignment says, most of the time', () => {
    const position = resolveSessionStartPosition(
      buildAssignment({ currentWeekNumber: 6, currentPhaseNumber: 2, nextSessionLetter: 'B' }),
      twelveWeekFoundationProgram,
      determineLayoffAdjustment(2),
    );

    expect(position).toEqual({
      weekNumber: 6,
      sessionLetter: 'B',
      phaseNumber: 2,
      didRestartPhase: false,
    });
  });

  it('corrects a phase number that disagrees with the week', () => {
    const position = resolveSessionStartPosition(
      buildAssignment({ currentWeekNumber: 9, currentPhaseNumber: 1 }),
      twelveWeekFoundationProgram,
      determineLayoffAdjustment(1),
    );

    expect(position.phaseNumber).toBe(3);
  });

  it('restarts the phase after ten days away', () => {
    const position = resolveSessionStartPosition(
      buildAssignment({ currentWeekNumber: 7, currentPhaseNumber: 2 }),
      twelveWeekFoundationProgram,
      determineLayoffAdjustment(14),
    );

    expect(position.weekNumber).toBe(5);
    expect(position.didRestartPhase).toBe(true);
  });

  it('does not restart a phase he is already at the start of', () => {
    const position = resolveSessionStartPosition(
      buildAssignment({ currentWeekNumber: 5, currentPhaseNumber: 2 }),
      twelveWeekFoundationProgram,
      determineLayoffAdjustment(21),
    );

    expect(position.weekNumber).toBe(5);
    expect(position.didRestartPhase).toBe(false);
  });

  it('leaves a brand new user alone, having nothing to return from', () => {
    const position = resolveSessionStartPosition(
      buildAssignment(),
      twelveWeekFoundationProgram,
      determineLayoffAdjustment(null),
    );

    expect(position.weekNumber).toBe(1);
    expect(position.didRestartPhase).toBe(false);
  });
});

describe('advanceProgramAssignmentAfterSession', () => {
  const advance = (assignment: ProgramAssignment, completedSessionLetter: 'A' | 'B' | 'C') =>
    advanceProgramAssignmentAfterSession({
      assignment,
      programTemplate: twelveWeekFoundationProgram,
      completedSessionLetter,
      completedWeekNumber: assignment.currentWeekNumber,
      completedOn: '2026-09-04',
    });

  it('moves A to B without touching the week', () => {
    const advanced = advance(buildAssignment({ currentWeekNumber: 3 }), 'A');

    expect(advanced.nextSessionLetter).toBe('B');
    expect(advanced.currentWeekNumber).toBe(3);
  });

  it('rolls the week over after session C and not before', () => {
    const advanced = advance(buildAssignment({ currentWeekNumber: 3 }), 'C');

    expect(advanced.nextSessionLetter).toBe('A');
    expect(advanced.currentWeekNumber).toBe(4);
  });

  it('moves into the next phase when the new week belongs to it', () => {
    const advanced = advance(buildAssignment({ currentWeekNumber: 4, currentPhaseNumber: 1 }), 'C');

    expect(advanced.currentWeekNumber).toBe(5);
    expect(advanced.currentPhaseNumber).toBe(2);
  });

  it('completes the programme after the last session of the last week', () => {
    const advanced = advance(
      buildAssignment({ currentWeekNumber: 12, currentPhaseNumber: 3 }),
      'C',
    );

    expect(advanced.status).toBe('completed');
    expect(advanced.completedOn).toBe('2026-09-04');
    expect(advanced.currentWeekNumber).toBe(12);
  });

  it('does not complete the programme half way through its last week', () => {
    const advanced = advance(
      buildAssignment({ currentWeekNumber: 12, currentPhaseNumber: 3 }),
      'B',
    );

    expect(advanced.status).toBe('active');
    expect(advanced.completedOn).toBeNull();
    expect(advanced.nextSessionLetter).toBe('C');
  });

  it('keeps everything the session did not change', () => {
    const assignment = buildAssignment({ currentWeekNumber: 2 });
    const advanced = advance(assignment, 'A');

    expect(advanced.programTemplateId).toBe(assignment.programTemplateId);
    expect(advanced.startedOn).toBe(assignment.startedOn);
  });
});
