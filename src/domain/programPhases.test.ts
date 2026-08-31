import { describe, expect, it } from 'vitest';

import {
  determineNextSessionLetter,
  findFirstWeekNumberOfPhase,
  findPhaseForWeekNumber,
  findProgramWeek,
  findSessionTemplate,
  isProgramComplete,
} from './programPhases';
import { twelveWeekFoundationProgram } from '@/content/programs/twelveWeekFoundation/twelveWeekFoundationProgram';

/**
 * These tests run against the real programme rather than a hand-built fixture.
 * A fixture would prove the lookups work on a fixture; the shipped programme is
 * the thing they will actually be pointed at, and a twelve week template is not
 * something worth reconstructing by hand.
 *
 * Note the direction of the dependency: this is a TEST importing content. The
 * `src/domain/` source files themselves import nothing but types, and that is
 * what the architecture rule is about.
 *
 * Assertions about what the content SAYS — which week is the deload, which is
 * calibration — live in `src/content/programs/allProgramTemplates.test.ts`.
 */

describe('findPhaseForWeekNumber', () => {
  it.each([
    [1, 1],
    [4, 1],
    [5, 2],
    [8, 2],
    [9, 3],
    [12, 3],
  ])('puts week %i in phase %i', (weekNumber, expectedPhaseNumber) => {
    expect(findPhaseForWeekNumber(twelveWeekFoundationProgram, weekNumber)?.phaseNumber).toBe(
      expectedPhaseNumber,
    );
  });

  it('returns null for a week outside the programme', () => {
    expect(findPhaseForWeekNumber(twelveWeekFoundationProgram, 0)).toBeNull();
    expect(findPhaseForWeekNumber(twelveWeekFoundationProgram, 13)).toBeNull();
  });
});

describe('findProgramWeek', () => {
  it('finds the two-set weeks at the start of Phase 1', () => {
    expect(findProgramWeek(twelveWeekFoundationProgram, 1)?.workingSetCount).toBe(2);
    expect(findProgramWeek(twelveWeekFoundationProgram, 2)?.workingSetCount).toBe(2);
  });

  it('finds the three-set weeks that follow them', () => {
    expect(findProgramWeek(twelveWeekFoundationProgram, 3)?.workingSetCount).toBe(3);
    expect(findProgramWeek(twelveWeekFoundationProgram, 4)?.workingSetCount).toBe(3);
  });

  it('returns null for a week outside the programme', () => {
    expect(findProgramWeek(twelveWeekFoundationProgram, 99)).toBeNull();
  });
});

describe('findSessionTemplate', () => {
  it('finds each of the three sessions in every phase', () => {
    for (const phase of twelveWeekFoundationProgram.phases) {
      expect(findSessionTemplate(phase, 'A')?.sessionLetter, `phase ${phase.phaseNumber}`).toBe(
        'A',
      );
      expect(findSessionTemplate(phase, 'B')?.sessionLetter, `phase ${phase.phaseNumber}`).toBe(
        'B',
      );
      expect(findSessionTemplate(phase, 'C')?.sessionLetter, `phase ${phase.phaseNumber}`).toBe(
        'C',
      );
    }
  });
});

describe('determineNextSessionLetter', () => {
  it('cycles A to B to C and back to A', () => {
    expect(determineNextSessionLetter('A')).toBe('B');
    expect(determineNextSessionLetter('B')).toBe('C');
    expect(determineNextSessionLetter('C')).toBe('A');
  });

  it('returns to where it started after three sessions', () => {
    const afterThree = determineNextSessionLetter(
      determineNextSessionLetter(determineNextSessionLetter('A')),
    );

    expect(afterThree).toBe('A');
  });
});

describe('findFirstWeekNumberOfPhase', () => {
  it.each([
    [1, 1],
    [2, 5],
    [3, 9],
  ])('starts phase %i at week %i', (phaseNumber, expectedWeekNumber) => {
    const phase = twelveWeekFoundationProgram.phases.find(
      (candidate) => candidate.phaseNumber === phaseNumber,
    );

    expect(phase).toBeDefined();
    expect(phase && findFirstWeekNumberOfPhase(phase)).toBe(expectedWeekNumber);
  });
});

describe('isProgramComplete', () => {
  it('is complete once every week has been done', () => {
    expect(isProgramComplete(twelveWeekFoundationProgram, 12)).toBe(true);
    expect(isProgramComplete(twelveWeekFoundationProgram, 13)).toBe(true);
  });

  it('is not complete before then', () => {
    expect(isProgramComplete(twelveWeekFoundationProgram, 11)).toBe(false);
    expect(isProgramComplete(twelveWeekFoundationProgram, 0)).toBe(false);
  });
});
