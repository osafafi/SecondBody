import { describe, expect, it } from 'vitest';

import { twelveWeekFoundationProgram } from '@/content/programs/twelveWeekFoundation/twelveWeekFoundationProgram';
import type { BodyMetricEntry } from '@/types/dailyTrackingTypes';
import type { JournalEntry } from '@/types/journalTypes';
import type {
  PerformedSet,
  ProgramAssignment,
  WithDocumentId,
  WorkoutSession,
} from '@/types/trainingHistoryTypes';
import type { UserProfile } from '@/types/userAccountTypes';

import {
  buildCoachingBundle,
  buildCoachingBundleFileName,
  COACHING_BUNDLE_FORMAT_VERSION,
  describePerformedSet,
  formatCoachingBundleAsJson,
  type CoachingBundleInput,
} from './coachingBundle';
import type { HabitDay } from './habitCompliance';

/*
 * A fixed instant, because everything in this module is a pure function of the
 * time it is handed. Late morning on a Tuesday, written without a timezone so
 * it is the same local day on a UTC runner and on a UTC+3 laptop — the lesson
 * from the clock-dependent test in session 14.
 */
const GENERATED_AT = new Date('2026-09-01T10:00:00');

const EXERCISE_NAMES: Record<string, string> = {
  legPress: 'Leg press',
  chestPressMachine: 'Chest press machine',
  farmersCarry: "Farmer's carry",
};

function resolveExerciseName(exerciseId: string): string | null {
  return EXERCISE_NAMES[exerciseId] ?? null;
}

function buildProfile(changes: Partial<UserProfile> = {}): UserProfile {
  return {
    displayName: 'Omar',
    birthYear: 1990,
    heightCentimetres: 178,
    startingWeightKilograms: 92,
    targetWeightKilograms: 82,
    painAreas: ['lowerBack'],
    excludedExerciseIds: [],
    availableEquipmentIds: ['legExtensionMachine'],
    trainingDaysOfWeek: [5, 1, 3],
    hasCompletedOnboarding: true,
    createdAt: new Date('2026-06-01T09:00:00'),
    updatedAt: new Date('2026-08-01T09:00:00'),
    ...changes,
  };
}

function buildAssignment(changes: Partial<ProgramAssignment> = {}): ProgramAssignment {
  return {
    programTemplateId: twelveWeekFoundationProgram.programTemplateId,
    startedOn: '2026-08-03',
    currentPhaseNumber: 2,
    currentWeekNumber: 5,
    nextSessionLetter: 'B',
    status: 'active',
    completedOn: null,
    ...changes,
  };
}

function buildPerformedSet(changes: Partial<PerformedSet> = {}): PerformedSet {
  return {
    setNumber: 1,
    prescribedWeightKilograms: 60,
    prescribedReps: 10,
    actualWeightKilograms: 60,
    actualReps: 10,
    effortRating: 'justRight',
    didCauseSharpPain: false,
    completedAt: new Date('2026-08-31T18:10:00'),
    restSecondsTaken: 90,
    ...changes,
  };
}

function buildSession(
  changes: Partial<WithDocumentId<WorkoutSession>> = {},
): WithDocumentId<WorkoutSession> {
  return {
    documentId: 'session-1',
    programAssignmentId: 'assignment-1',
    sessionLetter: 'A',
    phaseNumber: 2,
    weekNumber: 5,
    startedAt: new Date('2026-08-31T18:00:00'),
    completedAt: new Date('2026-08-31T19:05:00'),
    status: 'completed',
    performedExercises: [
      {
        exerciseId: 'legPress',
        orderIndex: 1,
        performedSets: [buildPerformedSet(), buildPerformedSet({ setNumber: 2, actualReps: 8 })],
        wasSkipped: false,
        skipReason: null,
      },
    ],
    totalVolumeKilograms: 1080,
    durationSeconds: 3900,
    sessionNotes: null,
    overallFeeling: 'normal',
    ...changes,
  };
}

function buildJournalEntry(
  changes: Partial<WithDocumentId<JournalEntry>> = {},
): WithDocumentId<JournalEntry> {
  return {
    documentId: 'entry-1',
    bodyText: 'Knee was quiet today.',
    entryKind: 'reflection',
    aboutDate: '2026-08-31',
    writtenAt: new Date('2026-08-31T20:00:00'),
    aboutSessionId: null,
    aboutExerciseId: null,
    reviewStatus: 'awaitingReview',
    reviewedAt: null,
    ...changes,
  };
}

function buildHabitDay(onDate: string, changes: Partial<HabitDay['record']> = {}): HabitDay {
  return {
    record: {
      onDate,
      didHitProteinTarget: true,
      didAvoidLiquidCalories: true,
      didCompleteMobilityRoutine: true,
      stepCount: 9000,
      sleepHours: 7.5,
      updatedAt: new Date(`${onDate}T21:00:00`),
      ...changes,
    },
    dailyStepTarget: 7000,
    nightlySleepTargetHours: 7,
  };
}

function buildBundleInput(changes: Partial<CoachingBundleInput> = {}): CoachingBundleInput {
  return {
    generatedAt: GENERATED_AT,
    profile: buildProfile(),
    assignment: buildAssignment(),
    programTemplate: twelveWeekFoundationProgram,
    sessions: [buildSession()],
    bodyMetricEntries: [],
    habitDays: [],
    personalRecords: [],
    journalEntries: [],
    resolveExerciseName,
    firstDayOfWeek: 1,
    ...changes,
  };
}

function buildBodyMetricEntry(recordedOn: string, weightKilograms: number | null): BodyMetricEntry {
  return {
    recordedOn,
    weightKilograms,
    waistCentimetres: null,
    chestCentimetres: null,
    hipsCentimetres: null,
    notes: null,
    createdAt: new Date(`${recordedOn}T07:00:00`),
  };
}

describe('collapsing a set to one line', () => {
  it('reads as weight, reps and how it felt', () => {
    expect(describePerformedSet(buildPerformedSet())).toBe('60 kg x 10 justRight');
  });

  it('says bodyweight rather than inventing a zero', () => {
    const set = buildPerformedSet({ actualWeightKilograms: null, prescribedWeightKilograms: null });

    expect(describePerformedSet(set)).toBe('bodyweight x 10 justRight');
  });

  /*
   * The gap between what was asked for and what happened is the input to
   * progression, so it has to survive into the bundle.
   */
  it('says what was prescribed when he did not hit it', () => {
    const set = buildPerformedSet({ actualReps: 7, effortRating: 'brutal' });

    expect(describePerformedSet(set)).toBe('60 kg x 7 brutal (prescribed 10)');
  });

  it('stays quiet about the prescription when it was met', () => {
    expect(describePerformedSet(buildPerformedSet())).not.toContain('prescribed');
  });

  it('flags sharp pain, because nothing outranks it', () => {
    const set = buildPerformedSet({ didCauseSharpPain: true });

    expect(describePerformedSet(set)).toBe('60 kg x 10 justRight (sharp pain)');
  });

  it('says nothing about pain when there was none', () => {
    expect(describePerformedSet(buildPerformedSet())).not.toContain('pain');
  });
});

describe('the athlete section', () => {
  it('carries who this is about', () => {
    const bundle = buildCoachingBundle(buildBundleInput());

    expect(bundle.athlete.displayName).toBe('Omar');
    expect(bundle.athlete.ageYears).toBe(36);
    expect(bundle.athlete.painAreas).toEqual(['lowerBack']);
  });

  it('sorts the training days and says them in words', () => {
    const bundle = buildCoachingBundle(buildBundleInput());

    expect(bundle.athlete.trainingDaysOfWeek).toEqual([1, 3, 5]);
    expect(bundle.athlete.trainingDayNames).toEqual(['Monday', 'Wednesday', 'Friday']);
  });

  it('names the exercises a physio ruled out rather than listing ids', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({ profile: buildProfile({ excludedExerciseIds: ['legPress'] }) }),
    );

    expect(bundle.athlete.excludedExercises).toEqual(['Leg press']);
  });

  it('falls back to the id when content no longer has the exercise', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({ profile: buildProfile({ excludedExerciseIds: ['somethingRenamed'] }) }),
    );

    expect(bundle.athlete.excludedExercises).toEqual(['somethingRenamed']);
  });
});

describe('the programme section', () => {
  it('reports where the block is, from the same summary the app draws', () => {
    const bundle = buildCoachingBundle(buildBundleInput());

    expect(bundle.programme?.displayName).toBe(twelveWeekFoundationProgram.displayName);
    expect(bundle.programme?.startedOn).toBe('2026-08-03');
    expect(bundle.programme?.progress.currentWeekNumber).toBe(5);
    expect(bundle.programme?.progress.completedSessionCount).toBe(1);
  });

  it('is null when the programme has not been started', () => {
    const bundle = buildCoachingBundle(buildBundleInput({ assignment: null }));

    expect(bundle.programme).toBeNull();
  });
});

describe('the training section', () => {
  it('names every exercise and collapses its sets', () => {
    const bundle = buildCoachingBundle(buildBundleInput());
    const [session] = bundle.training.sessions;

    expect(session?.exercises[0]?.exerciseName).toBe('Leg press');
    expect(session?.exercises[0]?.sets).toEqual([
      '60 kg x 10 justRight',
      '60 kg x 8 justRight (prescribed 10)',
    ]);
  });

  it('reports the session in local calendar days rather than instants', () => {
    const [session] = buildCoachingBundle(buildBundleInput()).training.sessions;

    expect(session?.startedOn).toBe('2026-08-31');
    expect(session?.completedOn).toBe('2026-08-31');
  });

  it('reports duration in minutes, because nobody thinks in seconds', () => {
    const [session] = buildCoachingBundle(buildBundleInput()).training.sessions;

    expect(session?.durationMinutes).toBe(65);
  });

  it('puts the exercises in the order they were performed', () => {
    const session = buildSession({
      performedExercises: [
        {
          exerciseId: 'chestPressMachine',
          orderIndex: 2,
          performedSets: [buildPerformedSet()],
          wasSkipped: false,
          skipReason: null,
        },
        {
          exerciseId: 'legPress',
          orderIndex: 1,
          performedSets: [buildPerformedSet()],
          wasSkipped: false,
          skipReason: null,
        },
      ],
    });

    const bundle = buildCoachingBundle(buildBundleInput({ sessions: [session] }));

    expect(bundle.training.sessions[0]?.exercises.map((exercise) => exercise.exerciseId)).toEqual([
      'legPress',
      'chestPressMachine',
    ]);
  });

  it('puts the sessions newest first whatever order they were read in', () => {
    const older = buildSession({
      documentId: 'session-old',
      startedAt: new Date('2026-08-24T18:00:00'),
      completedAt: new Date('2026-08-24T19:00:00'),
    });

    const bundle = buildCoachingBundle(buildBundleInput({ sessions: [older, buildSession()] }));

    expect(bundle.training.sessions.map((session) => session.sessionId)).toEqual([
      'session-1',
      'session-old',
    ]);
  });

  it('counts what was finished and what was walked away from separately', () => {
    const abandoned = buildSession({
      documentId: 'session-2',
      status: 'abandoned',
      completedAt: null,
      startedAt: new Date('2026-08-28T18:00:00'),
    });

    const bundle = buildCoachingBundle(buildBundleInput({ sessions: [buildSession(), abandoned] }));

    expect(bundle.training.completedSessionCount).toBe(1);
    expect(bundle.training.abandonedSessionCount).toBe(1);
  });

  it('still carries an abandoned session, because a walk-out is information', () => {
    const abandoned = buildSession({
      documentId: 'session-2',
      status: 'abandoned',
      completedAt: null,
    });

    const bundle = buildCoachingBundle(buildBundleInput({ sessions: [abandoned] }));

    expect(bundle.training.sessions).toHaveLength(1);
    expect(bundle.training.sessions[0]?.completedOn).toBeNull();
  });

  it('flags an exercise that hurt at the exercise level, not only inside a set line', () => {
    const session = buildSession({
      performedExercises: [
        {
          exerciseId: 'legPress',
          orderIndex: 1,
          performedSets: [buildPerformedSet(), buildPerformedSet({ didCauseSharpPain: true })],
          wasSkipped: false,
          skipReason: null,
        },
      ],
    });

    const bundle = buildCoachingBundle(buildBundleInput({ sessions: [session] }));

    expect(bundle.training.sessions[0]?.exercises[0]?.didCauseSharpPain).toBe(true);
  });

  it('reports the best estimated one-rep max of an exercise', () => {
    const session = buildSession({
      performedExercises: [
        {
          exerciseId: 'legPress',
          orderIndex: 1,
          performedSets: [
            buildPerformedSet({ actualWeightKilograms: 60, actualReps: 10 }),
            buildPerformedSet({ actualWeightKilograms: 70, actualReps: 8 }),
          ],
          wasSkipped: false,
          skipReason: null,
        },
      ],
    });

    const bundle = buildCoachingBundle(buildBundleInput({ sessions: [session] }));

    expect(bundle.training.sessions[0]?.exercises[0]?.bestEstimatedOneRepMaxKilograms).toBe(88.7);
  });

  /*
   * A carry stores metres in `actualReps`. Epley on that is a confident,
   * meaningless number — the same exclusion `personalRecordProgress` makes.
   */
  it('has no one-rep max for a movement with no load on it', () => {
    const session = buildSession({
      performedExercises: [
        {
          exerciseId: 'farmersCarry',
          orderIndex: 1,
          performedSets: [buildPerformedSet({ actualWeightKilograms: null, actualReps: 40 })],
          wasSkipped: false,
          skipReason: null,
        },
      ],
    });

    const bundle = buildCoachingBundle(buildBundleInput({ sessions: [session] }));

    expect(bundle.training.sessions[0]?.exercises[0]?.bestEstimatedOneRepMaxKilograms).toBeNull();
  });

  it('keeps the empty weeks in the volume series', () => {
    const bundle = buildCoachingBundle(buildBundleInput());

    expect(bundle.training.weeklyVolume).toHaveLength(12);
    expect(bundle.training.weeklyVolume.filter((week) => week.sessionCount === 0).length).toBe(11);
  });
});

describe('the body weight section', () => {
  it('reports the rolling average rather than only the last reading', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({
        bodyMetricEntries: [
          buildBodyMetricEntry('2026-08-30', 90),
          buildBodyMetricEntry('2026-08-31', 89),
          buildBodyMetricEntry('2026-09-01', 91),
        ],
      }),
    );

    expect(bundle.bodyWeight.latestRecordedWeightKilograms).toBe(91);
    expect(bundle.bodyWeight.latestRollingAverageKilograms).toBe(90);
    expect(bundle.bodyWeight.series).toHaveLength(3);
  });

  it('says so plainly when nothing has been logged', () => {
    const bundle = buildCoachingBundle(buildBundleInput());

    expect(bundle.bodyWeight.latestRecordedWeightKilograms).toBeNull();
    expect(bundle.bodyWeight.verdict).toBe('noReadings');
  });

  it('ignores an entry that recorded a tape measure but no scale', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({ bodyMetricEntries: [buildBodyMetricEntry('2026-09-01', null)] }),
    );

    expect(bundle.bodyWeight.latestRecordedWeightKilograms).toBeNull();
  });
});

describe('the habits section', () => {
  it('summarises the days it was given and counts the streak', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({
        habitDays: [
          buildHabitDay('2026-09-01'),
          buildHabitDay('2026-08-31'),
          buildHabitDay('2026-08-30'),
        ],
      }),
    );

    expect(bundle.habits.daysConsidered).toBe(3);
    expect(bundle.habits.goodDayCount).toBe(3);
    expect(bundle.habits.currentStreakDays).toBe(3);
    expect(bundle.habits.rows.length).toBeGreaterThan(0);
  });
});

describe('the journal section', () => {
  it('carries what was written, exactly as it was written', () => {
    const verbatimText = 'Two things.\n\n1. Shoulder clicked.\n2. Sleep was bad.';

    const bundle = buildCoachingBundle(
      buildBundleInput({ journalEntries: [buildJournalEntry({ bodyText: verbatimText })] }),
    );

    expect(bundle.journal.awaitingReview[0]?.bodyText).toBe(verbatimText);
  });

  it('separates what a review has seen from what it has not', () => {
    const reviewed = buildJournalEntry({
      documentId: 'entry-old',
      reviewStatus: 'reviewed',
      reviewedAt: new Date('2026-08-25T20:00:00'),
      writtenAt: new Date('2026-08-24T20:00:00'),
    });

    const bundle = buildCoachingBundle(
      buildBundleInput({ journalEntries: [reviewed, buildJournalEntry()] }),
    );

    expect(bundle.journal.awaitingReview.map((entry) => entry.entryId)).toEqual(['entry-1']);
    expect(bundle.journal.alreadyReviewed.map((entry) => entry.entryId)).toEqual(['entry-old']);
  });

  it('puts entries newest first', () => {
    const older = buildJournalEntry({
      documentId: 'entry-old',
      writtenAt: new Date('2026-08-20T20:00:00'),
    });

    const bundle = buildCoachingBundle(
      buildBundleInput({ journalEntries: [older, buildJournalEntry()] }),
    );

    expect(bundle.journal.awaitingReview.map((entry) => entry.entryId)).toEqual([
      'entry-1',
      'entry-old',
    ]);
  });

  it('labels a tagged session so a reader can find it above', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({
        journalEntries: [buildJournalEntry({ aboutSessionId: 'session-1' })],
      }),
    );

    expect(bundle.journal.awaitingReview[0]?.aboutSessionLabel).toBe('Session A, week 5');
  });

  it('leaves the label null when the session is older than the window read', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({
        journalEntries: [buildJournalEntry({ aboutSessionId: 'session-from-april' })],
      }),
    );

    expect(bundle.journal.awaitingReview[0]?.aboutSessionId).toBe('session-from-april');
    expect(bundle.journal.awaitingReview[0]?.aboutSessionLabel).toBeNull();
  });

  it('names a tagged exercise', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({ journalEntries: [buildJournalEntry({ aboutExerciseId: 'legPress' })] }),
    );

    expect(bundle.journal.awaitingReview[0]?.aboutExerciseName).toBe('Leg press');
  });

  it('keeps the day an entry is about separate from when it was typed', () => {
    const bundle = buildCoachingBundle(
      buildBundleInput({
        journalEntries: [
          buildJournalEntry({
            aboutDate: '2026-08-31',
            writtenAt: new Date('2026-09-01T00:10:00'),
          }),
        ],
      }),
    );

    expect(bundle.journal.awaitingReview[0]?.aboutDate).toBe('2026-08-31');
    expect(bundle.journal.awaitingReview[0]?.writtenAt).toBe(
      new Date('2026-09-01T00:10:00').toISOString(),
    );
  });
});

describe('the bundle as a file', () => {
  it('stamps the format version and the moment it was built', () => {
    const bundle = buildCoachingBundle(buildBundleInput());

    expect(bundle.bundleFormatVersion).toBe(COACHING_BUNDLE_FORMAT_VERSION);
    expect(bundle.generatedAt).toBe(GENERATED_AT.toISOString());
  });

  /*
   * The claim the two callers rest on. A bundle downloaded from the phone and a
   * bundle exported from the laptop have to be the same file, or a diff between
   * two weeks is a diff of nothing in particular.
   */
  it('produces the same bytes twice from the same data', () => {
    const first = formatCoachingBundleAsJson(buildCoachingBundle(buildBundleInput()));
    const second = formatCoachingBundleAsJson(buildCoachingBundle(buildBundleInput()));

    expect(first).toBe(second);
  });

  it('does not depend on the order the reads came back in', () => {
    const sessionOne = buildSession();
    const sessionTwo = buildSession({
      documentId: 'session-2',
      startedAt: new Date('2026-08-28T18:00:00'),
      completedAt: new Date('2026-08-28T19:00:00'),
    });

    const oneWay = formatCoachingBundleAsJson(
      buildCoachingBundle(buildBundleInput({ sessions: [sessionOne, sessionTwo] })),
    );

    const otherWay = formatCoachingBundleAsJson(
      buildCoachingBundle(buildBundleInput({ sessions: [sessionTwo, sessionOne] })),
    );

    expect(oneWay).toBe(otherWay);
  });

  it('is parseable JSON ending in a newline', () => {
    const json = formatCoachingBundleAsJson(buildCoachingBundle(buildBundleInput()));

    expect(json.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(json) as unknown).not.toThrow();
  });

  it('names the file after the local day it was built on', () => {
    expect(buildCoachingBundleFileName(GENERATED_AT)).toBe('coaching-bundle-2026-09-01.json');
  });

  it('mutates nothing it was handed', () => {
    const sessions = [buildSession({ documentId: 'session-2' }), buildSession()];
    const sessionIdsBefore = sessions.map((session) => session.documentId);

    buildCoachingBundle(buildBundleInput({ sessions }));

    expect(sessions.map((session) => session.documentId)).toEqual(sessionIdsBefore);
  });
});
