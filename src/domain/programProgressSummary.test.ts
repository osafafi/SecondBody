import { describe, expect, it } from 'vitest';

import { twelveWeekFoundationProgram } from '@/content/programs/twelveWeekFoundation/twelveWeekFoundationProgram';
import type { ProgramAssignment } from '@/types/trainingHistoryTypes';

import {
  countTotalProgrammeSessions,
  isFirstSessionOfPhase,
  summariseProgramProgress,
} from './programProgressSummary';

/*
 * Tested against the real twelve week programme rather than a fixture. A
 * summary that is right about a hand-built three-week stub and wrong about the
 * programme that ships would tell nobody anything.
 */
const programTemplate = twelveWeekFoundationProgram;

function buildAssignment(overrides: Partial<ProgramAssignment> = {}): ProgramAssignment {
  return {
    programTemplateId: programTemplate.programTemplateId,
    startedOn: '2026-04-06',
    currentPhaseNumber: 1,
    currentWeekNumber: 1,
    nextSessionLetter: 'A',
    status: 'active',
    completedOn: null,
    ...overrides,
  };
}

describe('countTotalProgrammeSessions', () => {
  it('counts twelve weeks of three sessions', () => {
    expect(countTotalProgrammeSessions(programTemplate)).toBe(36);
  });
});

describe('summariseProgramProgress', () => {
  it('reports where week 1 is', () => {
    const summary = summariseProgramProgress({
      programTemplate,
      assignment: buildAssignment(),
      completedSessionCount: 0,
    });

    expect(summary.currentWeekNumber).toBe(1);
    expect(summary.totalWeekCount).toBe(12);
    expect(summary.currentPhaseNumber).toBe(1);
    expect(summary.weekNumberWithinPhase).toBe(1);
    expect(summary.isCalibrationWeek).toBe(true);
  });

  it('counts the week within its phase rather than across the programme', () => {
    // Week 6 is the second week of phase 2.
    const summary = summariseProgramProgress({
      programTemplate,
      assignment: buildAssignment({ currentWeekNumber: 6, currentPhaseNumber: 2 }),
      completedSessionCount: 15,
    });

    expect(summary.currentPhaseNumber).toBe(2);
    expect(summary.weekNumberWithinPhase).toBe(2);
    expect(summary.weekCountInPhase).toBe(4);
    expect(summary.phaseDisplayName).not.toBe('');
  });

  it('measures progress in sessions completed, not weeks elapsed', () => {
    const summary = summariseProgramProgress({
      programTemplate,
      assignment: buildAssignment({ currentWeekNumber: 6 }),
      completedSessionCount: 9,
    });

    // Nine of thirty-six, even though the calendar says he is in week six.
    expect(summary.completedFraction).toBeCloseTo(0.25, 5);
  });

  it('does not let extra sessions push the fraction past one', () => {
    const summary = summariseProgramProgress({
      programTemplate,
      assignment: buildAssignment({ currentWeekNumber: 12 }),
      completedSessionCount: 40,
    });

    expect(summary.completedFraction).toBe(1);
  });

  it('finds the deload week', () => {
    const deloadWeekNumber = programTemplate.phases
      .flatMap((phase) => phase.weeks)
      .find((week) => week.isDeloadWeek)?.weekNumber;

    expect(deloadWeekNumber).toBeDefined();

    const summary = summariseProgramProgress({
      programTemplate,
      assignment: buildAssignment({ currentWeekNumber: deloadWeekNumber ?? 1 }),
      completedSessionCount: 0,
    });

    expect(summary.isDeloadWeek).toBe(true);
  });

  it('reports a finished programme from the assignment status', () => {
    const summary = summariseProgramProgress({
      programTemplate,
      assignment: buildAssignment({
        currentWeekNumber: 12,
        status: 'completed',
        completedOn: '2026-06-26',
      }),
      completedSessionCount: 36,
    });

    expect(summary.isProgrammeFinished).toBe(true);
  });

  it('falls back to the assignment when the week is outside the programme', () => {
    const summary = summariseProgramProgress({
      programTemplate,
      assignment: buildAssignment({ currentWeekNumber: 99, currentPhaseNumber: 3 }),
      completedSessionCount: 36,
    });

    expect(summary.currentPhaseNumber).toBe(3);
    expect(summary.weekNumberWithinPhase).toBe(1);
    expect(summary.weekCountInPhase).toBe(0);
  });
});

describe('isFirstSessionOfPhase', () => {
  it('is true for session A of week 1', () => {
    expect(isFirstSessionOfPhase(programTemplate, 1, 'A')).toBe(true);
  });

  it('is true for session A of the first week of a later phase', () => {
    expect(isFirstSessionOfPhase(programTemplate, 5, 'A')).toBe(true);
    expect(isFirstSessionOfPhase(programTemplate, 9, 'A')).toBe(true);
  });

  it('is false for the other sessions of that same week', () => {
    expect(isFirstSessionOfPhase(programTemplate, 5, 'B')).toBe(false);
    expect(isFirstSessionOfPhase(programTemplate, 5, 'C')).toBe(false);
  });

  it('is false for session A of a week in the middle of a phase', () => {
    expect(isFirstSessionOfPhase(programTemplate, 6, 'A')).toBe(false);
  });

  it('is false for a week outside the programme', () => {
    expect(isFirstSessionOfPhase(programTemplate, 99, 'A')).toBe(false);
  });
});
