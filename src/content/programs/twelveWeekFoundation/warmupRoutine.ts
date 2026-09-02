import type { WarmupRoutine } from '@/types/programTypes';

/**
 * The warm-up performed before every session in every phase.
 *
 * It is training, not padding — it is where mobility actually improves — so it
 * is never skipped and its volume never drops to nothing. What changes is the
 * dose: a session that starts before 10:00 gets the longer version, because a
 * body that has just got out of bed is measurably stiffer.
 *
 * The morning volumes are the table in docs/TRAINING_PROGRAM.md section 3, with
 * the bike lengthened — see the note on the first step. The standard volumes are
 * the same movements at a lighter dose, which brings the routine from roughly
 * twelve minutes down to roughly eight.
 */
export const fullBodyWarmupRoutine: WarmupRoutine = {
  warmupRoutineId: 'fullBodyWarmup',
  displayName: 'Warm-up',
  morningCutoffHour: 10,

  steps: [
    {
      orderIndex: 1,
      exerciseId: 'stationaryBikeEasy',
      /*
       * Four minutes, five before 10:00. It was two and three, and F12 in
       * docs/FEEDBACK.md is Omar after his first session: "2 minutes felt really
       * short". Asked what he wanted instead, he said four. Two minutes is
       * enough to raise tissue temperature on paper and is not enough to feel
       * ready, and the second of those is the one that decides whether a warm-up
       * gets done properly.
       */
      morningVolume: { reps: null, durationSeconds: 300, isPerSide: false },
      standardVolume: { reps: null, durationSeconds: 240, isPerSide: false },
      purpose: 'Raise tissue temperature and get the legs turning over.',
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
