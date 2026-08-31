import { describe, expect, it } from 'vitest';

import {
  determineLayoffAdjustment,
  LAYOFF_LOAD_MULTIPLIER,
  LAYOFF_THRESHOLD_DAYS,
} from './layoffRecovery';

describe('determineLayoffAdjustment', () => {
  it('changes nothing for someone who has never trained', () => {
    const adjustment = determineLayoffAdjustment(null);

    expect(adjustment.isReturningFromLayoff).toBe(false);
    expect(adjustment.shouldRestartCurrentPhase).toBe(false);
    expect(adjustment.loadMultiplier).toBe(1);
    expect(adjustment.daysSinceLastSession).toBe(0);
  });

  it('changes nothing after a normal gap between sessions', () => {
    const adjustment = determineLayoffAdjustment(2);

    expect(adjustment.isReturningFromLayoff).toBe(false);
    expect(adjustment.loadMultiplier).toBe(1);
  });

  it('changes nothing after a missed week, which is a bad week rather than a layoff', () => {
    const adjustment = determineLayoffAdjustment(LAYOFF_THRESHOLD_DAYS - 1);

    expect(adjustment.isReturningFromLayoff).toBe(false);
    expect(adjustment.shouldRestartCurrentPhase).toBe(false);
  });

  it('restarts the phase at eighty percent at exactly ten days', () => {
    const adjustment = determineLayoffAdjustment(LAYOFF_THRESHOLD_DAYS);

    expect(adjustment.isReturningFromLayoff).toBe(true);
    expect(adjustment.shouldRestartCurrentPhase).toBe(true);
    expect(adjustment.loadMultiplier).toBe(LAYOFF_LOAD_MULTIPLIER);
  });

  it('does the same after a much longer gap, rather than scaling further down', () => {
    const adjustment = determineLayoffAdjustment(90);

    expect(adjustment.loadMultiplier).toBe(LAYOFF_LOAD_MULTIPLIER);
    expect(adjustment.daysSinceLastSession).toBe(90);
  });

  it('uses the threshold and multiplier the training document specifies', () => {
    expect(LAYOFF_THRESHOLD_DAYS).toBe(10);
    expect(LAYOFF_LOAD_MULTIPLIER).toBe(0.8);
  });
});
