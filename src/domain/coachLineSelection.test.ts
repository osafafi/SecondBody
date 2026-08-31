import { describe, expect, it } from 'vitest';

import {
  canSpendPraiseOnLoadDecision,
  isLineAllowedAtVerbosity,
  selectCoachLine,
  SESSIONS_BETWEEN_COMPLETION_PRAISE,
  shouldPraiseSessionCompletion,
} from './coachLineSelection';
import type { CoachLine } from '@/types/coachVoiceTypes';

function buildCoachLine(overrides: Partial<CoachLine> = {}): CoachLine {
  return {
    coachLineId: 'test.line',
    category: 'sessionOpening',
    text: 'Something Harout would say.',
    minimumVerbosity: 'minimal',
    isPraise: false,
    ...overrides,
  };
}

const QUIET_LINE = buildCoachLine({ coachLineId: 'quiet', minimumVerbosity: 'minimal' });
const CHATTY_LINE = buildCoachLine({ coachLineId: 'chatty', minimumVerbosity: 'detailed' });
const PRAISE_LINE = buildCoachLine({ coachLineId: 'praise', isPraise: true });

describe('isLineAllowedAtVerbosity', () => {
  it('always allows a minimal line', () => {
    expect(isLineAllowedAtVerbosity(QUIET_LINE, 'minimal')).toBe(true);
    expect(isLineAllowedAtVerbosity(QUIET_LINE, 'detailed')).toBe(true);
  });

  it('holds a detailed line back from someone who asked for less', () => {
    expect(isLineAllowedAtVerbosity(CHATTY_LINE, 'minimal')).toBe(false);
    expect(isLineAllowedAtVerbosity(CHATTY_LINE, 'standard')).toBe(false);
    expect(isLineAllowedAtVerbosity(CHATTY_LINE, 'detailed')).toBe(true);
  });
});

describe('selectCoachLine', () => {
  it('returns a line that fits the configured verbosity', () => {
    const selected = selectCoachLine({
      candidateLines: [QUIET_LINE, CHATTY_LINE],
      configuredVerbosity: 'minimal',
      rotationIndex: 0,
      mayUsePraise: false,
    });

    expect(selected?.coachLineId).toBe('quiet');
  });

  it('rotates through the eligible lines rather than repeating one', () => {
    const first = buildCoachLine({ coachLineId: 'first' });
    const second = buildCoachLine({ coachLineId: 'second' });
    const third = buildCoachLine({ coachLineId: 'third' });

    const selectAt = (rotationIndex: number) =>
      selectCoachLine({
        candidateLines: [first, second, third],
        configuredVerbosity: 'minimal',
        rotationIndex,
        mayUsePraise: false,
      })?.coachLineId;

    expect([selectAt(0), selectAt(1), selectAt(2), selectAt(3)]).toEqual([
      'first',
      'second',
      'third',
      'first',
    ]);
  });

  it('is deterministic, because nothing in the domain layer is random', () => {
    const input = {
      candidateLines: [QUIET_LINE, buildCoachLine({ coachLineId: 'other' })],
      configuredVerbosity: 'standard' as const,
      rotationIndex: 7,
      mayUsePraise: false,
    };

    expect(selectCoachLine(input)?.coachLineId).toBe(selectCoachLine(input)?.coachLineId);
  });

  it('withholds praise entirely when there is nothing to praise', () => {
    const selected = selectCoachLine({
      candidateLines: [PRAISE_LINE],
      configuredVerbosity: 'detailed',
      rotationIndex: 0,
      mayUsePraise: false,
    });

    expect(selected).toBeNull();
  });

  it('offers praise when it has been earned', () => {
    const selected = selectCoachLine({
      candidateLines: [PRAISE_LINE],
      configuredVerbosity: 'minimal',
      rotationIndex: 0,
      mayUsePraise: true,
    });

    expect(selected?.coachLineId).toBe('praise');
  });

  it('says nothing rather than falling back to something generic', () => {
    expect(
      selectCoachLine({
        candidateLines: [],
        configuredVerbosity: 'detailed',
        rotationIndex: 0,
        mayUsePraise: true,
      }),
    ).toBeNull();

    expect(
      selectCoachLine({
        candidateLines: [CHATTY_LINE],
        configuredVerbosity: 'minimal',
        rotationIndex: 0,
        mayUsePraise: true,
      }),
    ).toBeNull();
  });

  it('survives a negative or fractional rotation index', () => {
    const lines = [
      buildCoachLine({ coachLineId: 'first' }),
      buildCoachLine({ coachLineId: 'second' }),
    ];

    const selectAt = (rotationIndex: number) =>
      selectCoachLine({
        candidateLines: lines,
        configuredVerbosity: 'minimal',
        rotationIndex,
        mayUsePraise: false,
      })?.coachLineId;

    expect(selectAt(-1)).toBe('second');
    expect(selectAt(2.9)).toBe('first');
  });
});

describe('canSpendPraiseOnLoadDecision', () => {
  it('praises the load actually going up', () => {
    expect(canSpendPraiseOnLoadDecision('increasedAfterFullRange')).toBe(true);
  });

  it('does not praise holding, calibrating, or backing off', () => {
    expect(canSpendPraiseOnLoadDecision('held')).toBe(false);
    expect(canSpendPraiseOnLoadDecision('firstTimeCalibration')).toBe(false);
    expect(canSpendPraiseOnLoadDecision('reducedAfterBrutalSet')).toBe(false);
    expect(canSpendPraiseOnLoadDecision('reducedAfterSharpPain')).toBe(false);
  });
});

describe('shouldPraiseSessionCompletion', () => {
  it('stays quiet for most sessions, because turning up is the expectation', () => {
    expect(shouldPraiseSessionCompletion(1)).toBe(false);
    expect(shouldPraiseSessionCompletion(5)).toBe(false);
  });

  it('says something every sixth session, roughly once a fortnight', () => {
    expect(shouldPraiseSessionCompletion(SESSIONS_BETWEEN_COMPLETION_PRAISE)).toBe(true);
    expect(shouldPraiseSessionCompletion(SESSIONS_BETWEEN_COMPLETION_PRAISE * 2)).toBe(true);
  });

  it('says nothing before the first session has happened', () => {
    expect(shouldPraiseSessionCompletion(0)).toBe(false);
    expect(shouldPraiseSessionCompletion(-3)).toBe(false);
  });
});
