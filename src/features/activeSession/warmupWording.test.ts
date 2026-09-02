import { describe, expect, it } from 'vitest';

import type { WarmupVolume } from '@/types/programTypes';

import {
  describeEstimatedWarmupDuration,
  describeWarmupProgress,
  describeWarmupVolume,
} from './warmupWording';

function buildVolume(overrides: Partial<WarmupVolume> = {}): WarmupVolume {
  return { reps: null, durationSeconds: null, isPerSide: false, ...overrides };
}

describe('saying how much of a drill to do', () => {
  it('counts reps when the drill is counted in reps', () => {
    expect(describeWarmupVolume(buildVolume({ reps: 8 }))).toBe('8 reps');
  });

  it('says per side when it is per side', () => {
    expect(describeWarmupVolume(buildVolume({ reps: 10, isPerSide: true }))).toBe(
      '10 reps per side',
    );
  });

  it('counts short drills in seconds', () => {
    expect(describeWarmupVolume(buildVolume({ durationSeconds: 30 }))).toBe('30 seconds');
  });

  it('counts anything from two minutes up in minutes', () => {
    expect(describeWarmupVolume(buildVolume({ durationSeconds: 240 }))).toBe('4 minutes');
  });

  it('does not claim a dose it was not given', () => {
    expect(describeWarmupVolume(buildVolume())).toBe('as prescribed');
  });
});

describe('saying how long the warm-up will take', () => {
  it('rounds up to a whole minute', () => {
    expect(describeEstimatedWarmupDuration(469)).toBe('About 8 minutes');
  });

  it('never says nought minutes', () => {
    expect(describeEstimatedWarmupDuration(10)).toBe('About a minute');
  });
});

describe('saying how far through the warm-up he is', () => {
  it('does not open with a score of nought', () => {
    expect(describeWarmupProgress(0, 7)).toBe('7 to work through');
  });

  it('counts up in the middle', () => {
    expect(describeWarmupProgress(3, 7)).toBe('3 of 7 done');
  });

  it('says it is finished rather than showing a full score', () => {
    expect(describeWarmupProgress(7, 7)).toBe('All of them done');
  });
});
