import type { WarmupRoutine } from '@/types/programTypes';

/**
 * The warm-up performed before every session in every phase.
 *
 * It is training, not padding — it is where mobility actually improves — so it
 * is never skipped and its volume never drops to nothing. What changes is the
 * dose: a session that starts before 10:00 gets the longer version, because a
 * body that has just got out of bed is measurably stiffer.
 *
 * The morning volumes are exactly the table in docs/TRAINING_PROGRAM.md
 * section 3. The standard volumes are the same movements at a lighter dose,
 * which brings the routine from roughly ten minutes down to roughly six.
 */
export const fullBodyWarmupRoutine: WarmupRoutine = {
  warmupRoutineId: 'fullBodyWarmup',
  displayName: 'Warm-up',
  morningCutoffHour: 10,

  steps: [
    {
      orderIndex: 1,
      exerciseId: 'stationaryBikeEasy',
      morningVolume: { reps: null, durationSeconds: 180, isPerSide: false },
      standardVolume: { reps: null, durationSeconds: 120, isPerSide: false },
      purpose: 'Raise tissue temperature. Nothing more.',
    },
    {
      orderIndex: 2,
      exerciseId: 'ankleWallRocks',
      morningVolume: { reps: 10, durationSeconds: null, isPerSide: true },
      standardVolume: { reps: 8, durationSeconds: null, isPerSide: true },
      purpose: 'Ankle mobility, which is the root cause of most squat problems.',
    },
    {
      orderIndex: 3,
      exerciseId: 'catCow',
      morningVolume: { reps: 8, durationSeconds: null, isPerSide: false },
      standardVolume: { reps: 6, durationSeconds: null, isPerSide: false },
      purpose: 'Get the spine moving segment by segment.',
    },
    {
      orderIndex: 4,
      exerciseId: 'bandPullApart',
      morningVolume: { reps: 15, durationSeconds: null, isPerSide: false },
      standardVolume: { reps: 12, durationSeconds: null, isPerSide: false },
      purpose: 'Wake up the mid-back and rear delts.',
    },
    {
      orderIndex: 5,
      exerciseId: 'wallSlides',
      morningVolume: { reps: 10, durationSeconds: null, isPerSide: false },
      standardVolume: { reps: 8, durationSeconds: null, isPerSide: false },
      purpose: 'Shoulder blade control, before anything gets pressed.',
    },
    {
      orderIndex: 6,
      exerciseId: 'chinTucks',
      morningVolume: { reps: 10, durationSeconds: null, isPerSide: false },
      standardVolume: { reps: 8, durationSeconds: null, isPerSide: false },
      purpose: 'Deep neck flexors. This one is aimed straight at the neck pain.',
    },
    {
      orderIndex: 7,
      exerciseId: 'bodyweightHipHinge',
      morningVolume: { reps: 10, durationSeconds: null, isPerSide: false },
      standardVolume: { reps: 8, durationSeconds: null, isPerSide: false },
      purpose: 'Rehearse the hinge before it gets loaded.',
    },
  ],

  rampSetRepCount: 10,

  /**
   * Half of the first exercise's working weight. Light enough to be free, heavy
   * enough to rehearse the actual movement rather than a mime of it.
   */
  rampSetLoadMultiplier: 0.5,
};
