import type { ExerciseSlot } from '@/types/programTypes';

/**
 * What to do about a movement whose machine his gym does not have.
 *
 * F13 in docs/FEEDBACK.md, in his words: "some machines are not available in the
 * gym. for example today's Low Row exercise. i replaced it with a machine. but
 * i'd like to be able to flag an exercise as NOT available, so that the next
 * session you can read that and we'll adapt the exercises."
 *
 * **This is not `excludedExerciseIds`.** That list is a hard blacklist — a physio
 * said not to do it — and a slot it names simply does not appear. This one is
 * about a room, not about a body: the exercise is fine, the machine is not
 * there, and the slot still has a job to do. So the slot happens, with the best
 * equivalent the programme knows about.
 *
 * Asked what should happen, Omar chose "swap, but ask me first", so nothing here
 * decides anything silently: it produces the swap and the reason for it, and the
 * exercise brief puts both in front of him with a way to refuse.
 */

export type ExerciseAvailabilityAdjustment =
  | {
      /**
       * The movement the programme wrote is flagged unavailable, and this slot
       * is now a stand-in for it.
       */
      kind: 'substituted';

      /** What was replaced. Named on screen, so the swap is never silent. */
      unavailableExerciseId: string;
    }
  | {
      /**
       * Flagged unavailable and nothing equivalent was left to offer — every
       * substitute is itself unavailable, ruled out, or already in this session.
       *
       * The slot keeps its original movement rather than vanishing. A session
       * that quietly got shorter would be worse than one that says "you told me
       * this is not here, and I have nothing to put in its place".
       */
      kind: 'noSubstituteFound';
    };

export type ResolvedExerciseSlot = {
  /** The slot as it should be planned, with the exercise possibly swapped. */
  slot: ExerciseSlot;

  /** Null in the ordinary case, which is nearly every slot in nearly every session. */
  availabilityAdjustment: ExerciseAvailabilityAdjustment | null;
};

export type SessionSlotAvailabilityRequest = {
  /** In session order. Already filtered by `isExerciseSlotAvailable`. */
  slots: ExerciseSlot[];

  /** From the profile. Movements whose kit his gym does not have. */
  unavailableExerciseIds: string[];

  /** From the profile. The hard blacklist, which a substitute must also respect. */
  excludedExerciseIds: string[];

  /**
   * Equivalent movements, best first, from an exercise's `substituteExerciseIds`.
   * Passed in rather than imported: `src/domain/` may not read `src/content/`.
   */
  resolveSubstituteExerciseIds: (exerciseId: string) => string[];
};

/**
 * Every slot in one session, with the unavailable ones swapped out.
 *
 * Resolved for the session rather than one slot at a time, because a substitute
 * that is already in this session is not a substitute — it is the same movement
 * twice, and the second one would be performed against history the first one had
 * just written. Slots are walked in order and each remembers what the ones
 * before it took.
 */
export function resolveSessionSlotAvailability(
  request: SessionSlotAvailabilityRequest,
): ResolvedExerciseSlot[] {
  const { slots, unavailableExerciseIds, excludedExerciseIds, resolveSubstituteExerciseIds } =
    request;

  const exerciseIdsAlreadyInSession = new Set(slots.map((slot) => slot.exerciseId));

  return slots.map((slot) => {
    if (!unavailableExerciseIds.includes(slot.exerciseId)) {
      return { slot, availabilityAdjustment: null };
    }

    const substituteExerciseId = resolveSubstituteExerciseIds(slot.exerciseId).find(
      (candidateId) =>
        !unavailableExerciseIds.includes(candidateId) &&
        !excludedExerciseIds.includes(candidateId) &&
        !exerciseIdsAlreadyInSession.has(candidateId),
    );

    if (substituteExerciseId === undefined) {
      return { slot, availabilityAdjustment: { kind: 'noSubstituteFound' } };
    }

    /*
     * Claimed, so a second unavailable slot in the same session cannot be given
     * the same stand-in.
     */
    exerciseIdsAlreadyInSession.add(substituteExerciseId);

    return {
      slot: { ...slot, exerciseId: substituteExerciseId },
      availabilityAdjustment: {
        kind: 'substituted',
        unavailableExerciseId: slot.exerciseId,
      },
    };
  });
}

/**
 * The list with one more movement on it, or unchanged if it is already there.
 *
 * Sorted, so that two profiles that have flagged the same movements produce the
 * same document and a diff of the stored profile means something.
 */
export function addUnavailableExerciseId(
  unavailableExerciseIds: string[],
  exerciseId: string,
): string[] {
  if (unavailableExerciseIds.includes(exerciseId)) {
    return unavailableExerciseIds;
  }

  return [...unavailableExerciseIds, exerciseId].sort((first, second) =>
    first.localeCompare(second),
  );
}

/** The list with one movement taken off it. The gym bought a machine. */
export function removeUnavailableExerciseId(
  unavailableExerciseIds: string[],
  exerciseId: string,
): string[] {
  return unavailableExerciseIds.filter((candidateId) => candidateId !== exerciseId);
}
