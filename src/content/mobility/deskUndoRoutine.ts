import type { MobilityRoutine } from '@/types/programTypes';

/**
 * "Desk Undo" — ten minutes at home, every day, gym day or not.
 *
 * This is the part that fixes the stiffness. The gym work supports it; it does
 * not replace it. Everything here needs a mat, a band, a foam roller and a wall,
 * which is exactly what Omar already owns.
 *
 * Volumes are the table in docs/TRAINING_PROGRAM.md section 10, unchanged.
 */
export const deskUndoRoutine: MobilityRoutine = {
  mobilityRoutineId: 'deskUndo',
  displayName: 'Desk Undo',
  summary:
    'Ten minutes on the floor to give back what a day at a desk takes away. Do it on rest days too — especially on rest days.',
  estimatedDurationMinutes: 10,

  steps: [
    {
      orderIndex: 1,
      exerciseId: 'foamRollThoracicSpine',
      volume: { reps: null, durationSeconds: 60, isPerSide: false },
      purpose: 'Loosen the upper back first, so everything after it has room to move.',
    },
    {
      orderIndex: 2,
      exerciseId: 'catCow',
      volume: { reps: 10, durationSeconds: null, isPerSide: false },
      purpose: 'Wake the spine up segment by segment.',
    },
    {
      orderIndex: 3,
      exerciseId: 'threadTheNeedle',
      volume: { reps: 8, durationSeconds: null, isPerSide: true },
      purpose: 'Rotation, which is the first thing a desk takes away.',
    },
    {
      orderIndex: 4,
      exerciseId: 'ninetyNinetyHipSwitch',
      volume: { reps: 10, durationSeconds: null, isPerSide: false },
      purpose: 'Hip rotation, so your lower back stops doing your hips’ job.',
    },
    {
      orderIndex: 5,
      exerciseId: 'couchStretch',
      volume: { reps: null, durationSeconds: 45, isPerSide: true },
      purpose: 'Open the front of the hips, which six years of sitting has shortened.',
    },
    {
      orderIndex: 6,
      exerciseId: 'ankleWallRocks',
      volume: { reps: 12, durationSeconds: null, isPerSide: true },
      purpose: 'Ankles, so the squats keep improving between sessions.',
    },
    {
      orderIndex: 7,
      exerciseId: 'bandPullApart',
      volume: { reps: 20, durationSeconds: null, isPerSide: false },
      purpose: 'Pull the shoulders back where they belong.',
    },
    {
      orderIndex: 8,
      exerciseId: 'chinTucks',
      volume: { reps: 12, durationSeconds: null, isPerSide: false },
      purpose: 'Straight at the neck pain.',
    },
    {
      orderIndex: 9,
      exerciseId: 'doorwayPecStretch',
      volume: { reps: null, durationSeconds: 30, isPerSide: true },
      purpose: 'Let the front of the chest go, now that the back has been switched on.',
    },
  ],
};
