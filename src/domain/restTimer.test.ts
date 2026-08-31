import { describe, expect, it } from 'vitest';

import {
  formatDurationAsMinutesAndSeconds,
  measureRestSecondsTaken,
  readRestTimer,
} from './restTimer';

const REST_STARTED_AT = new Date('2026-09-02T09:00:00.000Z');

function secondsLater(seconds: number): Date {
  return new Date(REST_STARTED_AT.getTime() + seconds * 1000);
}

describe('readRestTimer', () => {
  it('counts down from the target', () => {
    const reading = readRestTimer(REST_STARTED_AT, 90, secondsLater(30));

    expect(reading.elapsedSeconds).toBe(30);
    expect(reading.remainingSeconds).toBe(60);
    expect(reading.hasReachedTarget).toBe(false);
    expect(reading.overrunSeconds).toBe(0);
  });

  it('stops at zero rather than going negative', () => {
    const reading = readRestTimer(REST_STARTED_AT, 90, secondsLater(150));

    expect(reading.remainingSeconds).toBe(0);
    expect(reading.hasReachedTarget).toBe(true);
  });

  it('reports the overrun, because standing around for four minutes is worth knowing', () => {
    const reading = readRestTimer(REST_STARTED_AT, 90, secondsLater(240));

    expect(reading.overrunSeconds).toBe(150);
  });

  it('reaches the target exactly on the target', () => {
    const reading = readRestTimer(REST_STARTED_AT, 90, secondsLater(90));

    expect(reading.hasReachedTarget).toBe(true);
    expect(reading.overrunSeconds).toBe(0);
    expect(reading.completedFraction).toBe(1);
  });

  it('fills the progress ring proportionally, and never past full', () => {
    expect(readRestTimer(REST_STARTED_AT, 90, secondsLater(45)).completedFraction).toBe(0.5);
    expect(readRestTimer(REST_STARTED_AT, 90, secondsLater(300)).completedFraction).toBe(1);
  });

  it('treats a clock that has gone backwards as no time having passed', () => {
    const reading = readRestTimer(REST_STARTED_AT, 90, secondsLater(-20));

    expect(reading.elapsedSeconds).toBe(0);
    expect(reading.remainingSeconds).toBe(90);
  });

  it('is already finished when there is no rest prescribed', () => {
    const reading = readRestTimer(REST_STARTED_AT, 0, REST_STARTED_AT);

    expect(reading.hasReachedTarget).toBe(true);
    expect(reading.completedFraction).toBe(1);
  });

  it('survives the phone sleeping through the whole rest', () => {
    const reading = readRestTimer(REST_STARTED_AT, 90, secondsLater(2400));

    expect(reading.hasReachedTarget).toBe(true);
    expect(reading.remainingSeconds).toBe(0);
    expect(reading.elapsedSeconds).toBe(2400);
  });
});

describe('formatDurationAsMinutesAndSeconds', () => {
  it('reads like a stopwatch', () => {
    expect(formatDurationAsMinutesAndSeconds(0)).toBe('0:00');
    expect(formatDurationAsMinutesAndSeconds(9)).toBe('0:09');
    expect(formatDurationAsMinutesAndSeconds(65)).toBe('1:05');
    expect(formatDurationAsMinutesAndSeconds(90)).toBe('1:30');
  });

  it('keeps counting in minutes rather than growing an hours field', () => {
    expect(formatDurationAsMinutesAndSeconds(3661)).toBe('61:01');
  });

  it('floors part-seconds and refuses to render a negative duration', () => {
    expect(formatDurationAsMinutesAndSeconds(59.9)).toBe('0:59');
    expect(formatDurationAsMinutesAndSeconds(-30)).toBe('0:00');
  });
});

describe('measureRestSecondsTaken', () => {
  it('measures a rest that actually happened', () => {
    expect(measureRestSecondsTaken(REST_STARTED_AT, secondsLater(115))).toBe(115);
  });

  it('reports null when no rest was timed, which is not the same as no rest', () => {
    expect(measureRestSecondsTaken(null, secondsLater(115))).toBeNull();
  });
});
