import { describe, expect, it } from 'vitest';

import {
  buildLoggedExercise,
  buildLoggedSet,
  buildWorkoutSession,
} from '@/test/trainingTestFactories';
import type { RepRange } from '@/types/trainingVocabulary';

import {
  buildExercisePerformanceHistories,
  countCompletedSessions,
  findLastCompletedSessionAt,
} from './exercisePerformanceHistory';

const TEN_TO_TWELVE: RepRange = { minimumReps: 10, maximumReps: 12 };
const alwaysTenToTwelve = (): RepRange => TEN_TO_TWELVE;

describe('buildExercisePerformanceHistories', () => {
  it('reads the last prescription and the sets performed against it', () => {
    const histories = buildExercisePerformanceHistories({
      recentSessions: [
        buildWorkoutSession({
          performedExercises: [
            buildLoggedExercise({
              exerciseId: 'legExtension',
              performedSets: [
                buildLoggedSet({ prescribedWeightKilograms: 32.5, actualReps: 12 }),
                buildLoggedSet({ setNumber: 2, prescribedWeightKilograms: 32.5, actualReps: 11 }),
              ],
            }),
          ],
        }),
      ],
      resolveCurrentRepRangeForExercise: alwaysTenToTwelve,
    });

    expect(histories['legExtension']?.lastPrescribedWeightKilograms).toBe(32.5);
    expect(histories['legExtension']?.lastPerformedSets).toHaveLength(2);
  });

  it('rebuilds the rep range from the stored top and the range width', () => {
    const histories = buildExercisePerformanceHistories({
      recentSessions: [
        buildWorkoutSession({
          performedExercises: [
            // A bodyweight movement that has already climbed twice: 6-8 became 10-12.
            buildLoggedExercise({
              exerciseId: 'deadBug',
              performedSets: [buildLoggedSet({ prescribedReps: 12 })],
            }),
          ],
        }),
      ],
      resolveCurrentRepRangeForExercise: (): RepRange => ({ minimumReps: 6, maximumReps: 8 }),
    });

    expect(histories['deadBug']?.lastPrescribedRepRange).toEqual({
      minimumReps: 10,
      maximumReps: 12,
    });
  });

  it('gives a movement with no rep range a degenerate one rather than a guessed width', () => {
    const histories = buildExercisePerformanceHistories({
      recentSessions: [
        buildWorkoutSession({
          performedExercises: [
            buildLoggedExercise({
              exerciseId: 'farmersCarry',
              performedSets: [buildLoggedSet({ prescribedReps: 30 })],
            }),
          ],
        }),
      ],
      resolveCurrentRepRangeForExercise: (): RepRange | null => null,
    });

    expect(histories['farmersCarry']?.lastPrescribedRepRange).toEqual({
      minimumReps: 30,
      maximumReps: 30,
    });
  });

  it('never rebuilds a rep range that starts below one', () => {
    const histories = buildExercisePerformanceHistories({
      recentSessions: [
        buildWorkoutSession({
          performedExercises: [
            buildLoggedExercise({ performedSets: [buildLoggedSet({ prescribedReps: 2 })] }),
          ],
        }),
      ],
      resolveCurrentRepRangeForExercise: (): RepRange => ({ minimumReps: 12, maximumReps: 15 }),
    });

    expect(histories['legExtension']?.lastPrescribedRepRange.minimumReps).toBe(1);
  });

  it('prefers the most recent session, which arrives first', () => {
    const histories = buildExercisePerformanceHistories({
      recentSessions: [
        buildWorkoutSession({
          performedExercises: [
            buildLoggedExercise({
              performedSets: [buildLoggedSet({ prescribedWeightKilograms: 35 })],
            }),
          ],
        }),
        buildWorkoutSession({
          performedExercises: [
            buildLoggedExercise({
              performedSets: [buildLoggedSet({ prescribedWeightKilograms: 30 })],
            }),
          ],
        }),
      ],
      resolveCurrentRepRangeForExercise: alwaysTenToTwelve,
    });

    expect(histories['legExtension']?.lastPrescribedWeightKilograms).toBe(35);
  });

  it('ignores a session that was abandoned, whose set counts prove nothing', () => {
    const histories = buildExercisePerformanceHistories({
      recentSessions: [
        buildWorkoutSession({
          status: 'inProgress',
          completedAt: null,
          performedExercises: [
            buildLoggedExercise({
              performedSets: [buildLoggedSet({ prescribedWeightKilograms: 35 })],
            }),
          ],
        }),
        buildWorkoutSession({
          performedExercises: [
            buildLoggedExercise({
              performedSets: [buildLoggedSet({ prescribedWeightKilograms: 30 })],
            }),
          ],
        }),
      ],
      resolveCurrentRepRangeForExercise: alwaysTenToTwelve,
    });

    expect(histories['legExtension']?.lastPrescribedWeightKilograms).toBe(30);
  });

  it('keeps looking back past a session where the exercise was skipped', () => {
    const histories = buildExercisePerformanceHistories({
      recentSessions: [
        buildWorkoutSession({
          performedExercises: [
            buildLoggedExercise({ performedSets: [], wasSkipped: true, skipReason: 'Busy' }),
          ],
        }),
        buildWorkoutSession({
          performedExercises: [
            buildLoggedExercise({
              performedSets: [buildLoggedSet({ prescribedWeightKilograms: 27.5 })],
            }),
          ],
        }),
      ],
      resolveCurrentRepRangeForExercise: alwaysTenToTwelve,
    });

    expect(histories['legExtension']?.lastPrescribedWeightKilograms).toBe(27.5);
  });

  it('leaves an exercise that has never been trained out entirely', () => {
    const histories = buildExercisePerformanceHistories({
      recentSessions: [buildWorkoutSession()],
      resolveCurrentRepRangeForExercise: alwaysTenToTwelve,
    });

    expect(histories['dumbbellRomanianDeadlift']).toBeUndefined();
  });

  it('returns nothing at all for somebody who has never trained', () => {
    expect(
      buildExercisePerformanceHistories({
        recentSessions: [],
        resolveCurrentRepRangeForExercise: alwaysTenToTwelve,
      }),
    ).toEqual({});
  });
});

describe('findLastCompletedSessionAt', () => {
  it('finds the latest finish, whatever order the sessions arrive in', () => {
    const lastCompletedAt = findLastCompletedSessionAt([
      buildWorkoutSession({ completedAt: new Date('2026-09-02T18:00:00.000Z') }),
      buildWorkoutSession({ completedAt: new Date('2026-09-04T18:00:00.000Z') }),
      buildWorkoutSession({ completedAt: new Date('2026-08-31T18:00:00.000Z') }),
    ]);

    expect(lastCompletedAt).toEqual(new Date('2026-09-04T18:00:00.000Z'));
  });

  it('ignores sessions that were never finished', () => {
    const lastCompletedAt = findLastCompletedSessionAt([
      buildWorkoutSession({ status: 'inProgress', completedAt: null }),
      buildWorkoutSession({ completedAt: new Date('2026-09-02T18:00:00.000Z') }),
    ]);

    expect(lastCompletedAt).toEqual(new Date('2026-09-02T18:00:00.000Z'));
  });

  it('is null for somebody who has never finished one, not a date long ago', () => {
    expect(findLastCompletedSessionAt([])).toBeNull();
  });
});

describe('countCompletedSessions', () => {
  it('counts only the ones that were finished', () => {
    expect(
      countCompletedSessions([
        buildWorkoutSession(),
        buildWorkoutSession(),
        buildWorkoutSession({ status: 'abandoned' }),
        buildWorkoutSession({ status: 'inProgress', completedAt: null }),
      ]),
    ).toBe(2);
  });
});
