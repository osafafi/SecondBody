import type { EffortTargetRange, PainArea, RepRange, SessionLetter } from './trainingVocabulary';

/**
 * How one slot in a session is prescribed.
 *
 * A discriminated union rather than a bag of nullable fields, because "a
 * treadmill walk has no rep range" and "a dead bug has no weight" are facts
 * worth having the compiler enforce. Adding a kind forces every consumer to say
 * what it does with it.
 */
export type ExercisePrescription =
  | {
      kind: 'weightAndReps';
      repRange: RepRange;
      /** True when the reps are per side, as in a Pallof press. */
      isPerSide: boolean;
      /**
       * Where the load starts the first time this exercise is met in this phase,
       * before any history exists. From then on the weight comes from
       * progression instead — see `src/domain/exercisePrescription.ts`.
       */
      startingWeightKilograms: number;
    }
  | {
      kind: 'bodyweightReps';
      repRange: RepRange;
      isPerSide: boolean;
    }
  | {
      kind: 'loadedCarry';
      distanceMetresPerSet: number;
      /** Weight of ONE implement. A carry is always two of them. */
      startingWeightKilograms: number;
    }
  | {
      kind: 'steadyStateCardio';
      durationMinutes: number;
      /** The machine settings to dial in, e.g. "5% incline, 5 km/h". */
      machineSettingsNote: string;
    };

/** One exercise's place in one session. */
export type ExerciseSlot = {
  /** 1-based position in the session. Sessions are performed in this order. */
  orderIndex: number;

  exerciseId: string;

  prescription: ExercisePrescription;

  restSecondsBetweenSets: number;

  /**
   * A note about this slot rather than about the exercise, such as why it sits
   * here. Null when the exercise's own cues say everything worth saying.
   */
  slotNote: string | null;

  /**
   * The slot appears only when every listed pain area is currently clear.
   *
   * This exists for the landmine press, which docs/TRAINING_PROGRAM.md section 8
   * introduces in Phase 2 only "if the shoulders have gone quiet". An empty
   * array — the normal case — means the slot always appears.
   */
  requiresPainFreeAreas: PainArea[];
};

/** One of the three sessions the week cycles through. */
export type SessionTemplate = {
  sessionLetter: SessionLetter;

  /** e.g. "Legs & Pull". Shown on the schedule and at the top of the session. */
  displayName: string;

  /** One line on what this session is for, in Harout's voice. */
  summary: string;

  exerciseSlots: ExerciseSlot[];
};

/**
 * One week of the programme, stated explicitly rather than derived.
 *
 * Writing all twelve weeks out means the whole progression reads as a table in a
 * pull request, and means the deload week is a value in the content rather than
 * a special case buried in a function.
 */
export type ProgramWeek = {
  /** 1-based across the whole programme, not within the phase. */
  weekNumber: number;

  /** Working sets per exercise this week. The warm-up ramp set is not counted. */
  workingSetCount: number;

  /**
   * Multiplied into every prescribed load this week: 1 normally, 0.8 in the
   * deload week. Applied on top of whatever progression has earned.
   */
  loadMultiplier: number;

  isDeloadWeek: boolean;

  /**
   * True in week 1 only. There are no meaningful prescriptions yet, so the app
   * asks him to find his starting line instead of naming a number.
   * See docs/TRAINING_PROGRAM.md section 7.
   */
  isCalibrationWeek: boolean;

  /** Shown at the start of the week when there is something worth saying. */
  weekNote: string | null;
};

/** A block of weeks with a shared intent, a shared effort target and its own sessions. */
export type ProgramPhase = {
  phaseNumber: number;

  /** e.g. "Groove the patterns". */
  displayName: string;

  /** What this phase is for and why it is built this way. Shown when it begins. */
  summary: string;

  targetEffortRange: EffortTargetRange;

  /** In ascending week order, and contiguous with the neighbouring phases. */
  weeks: ProgramWeek[];

  /**
   * The phase's own A, B and C. Phases restate their sessions in full rather
   * than patching the previous phase's, so what will be trained in week 9 can be
   * read in one place instead of assembled from a chain of overrides.
   */
  sessionTemplates: SessionTemplate[];
};

/**
 * How much of a warm-up movement to do.
 *
 * Both volumes are written out in content rather than one being scaled from the
 * other. The morning dose is not a formula applied to the standard dose, it is a
 * judgement about a specific drill, so it is stated as one.
 */
export type WarmupVolume = {
  /** Repetitions, or null when the movement is timed instead. */
  reps: number | null;

  /** Seconds, or null when the movement is counted in reps instead. */
  durationSeconds: number | null;

  /** True when the volume is per side. */
  isPerSide: boolean;
};

export type WarmupStep = {
  orderIndex: number;
  exerciseId: string;

  /** Used when the session starts before `WarmupRoutine.morningCutoffHour`. */
  morningVolume: WarmupVolume;

  /** Used at every other time of day. Never null: no step is ever dropped entirely. */
  standardVolume: WarmupVolume;

  /** What this movement is for, in a few words. Shown beside it. */
  purpose: string;
};

export type WarmupRoutine = {
  warmupRoutineId: string;
  displayName: string;

  /**
   * Sessions starting before this hour get the longer volumes, because a body
   * that has just got out of bed is measurably stiffer. 10 means 10:00.
   * See docs/TRAINING_PROGRAM.md section 3.
   */
  morningCutoffHour: number;

  steps: WarmupStep[];

  /**
   * After the drills, one light set of the session's first exercise. It is
   * movement-specific preparation, so it cannot be a fixed step in the list.
   */
  rampSetRepCount: number;

  /** Fraction of the first exercise's working weight to use for the ramp set. */
  rampSetLoadMultiplier: number;
};

/** A complete training block. The app ships one; the content layer supports many. */
export type ProgramTemplate = {
  programTemplateId: string;
  displayName: string;
  summary: string;

  totalWeekCount: number;

  /** 0 = Sunday. The default is [1, 3, 5] — Monday, Wednesday, Friday. */
  defaultTrainingDaysOfWeek: number[];

  /**
   * The safety rail from docs/TRAINING_PROGRAM.md section 12: never two strength
   * sessions closer together than this.
   */
  minimumHoursBetweenSessions: number;

  /** Performed before the main work of every session in every phase. */
  warmupRoutine: WarmupRoutine;

  phases: ProgramPhase[];
};

export type MobilityStep = {
  orderIndex: number;
  exerciseId: string;
  volume: WarmupVolume;
  purpose: string;
};

/**
 * A standalone routine done at home, on training days and rest days alike.
 * The programme's gym work supports this; it does not replace it.
 */
export type MobilityRoutine = {
  mobilityRoutineId: string;
  displayName: string;
  summary: string;

  /** Roughly how long it takes, for the "have I got time for this" decision. */
  estimatedDurationMinutes: number;

  steps: MobilityStep[];
};
