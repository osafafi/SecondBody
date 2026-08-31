import {
  BicepsFlexed,
  Bone,
  CircleDot,
  Footprints,
  HandGrab,
  PersonStanding,
  Shield,
  Shirt,
  Spline,
  User,
  type LucideIcon,
} from 'lucide-react';

import type { MuscleGroup } from '@/types/trainingVocabulary';

/**
 * One icon per muscle group, so that the same muscle is always drawn the same
 * way wherever the app mentions it. See docs/DESIGN_SYSTEM.md section 7.
 *
 * `lucide-react` has no anatomical icon set, and the design system forbids
 * adding a second icon library. So these are **mnemonic rather than literal**:
 * icons chosen per body region, with the muscles of a region sharing one. That
 * is an honest reading of what an icon can carry at 20 px — a distinct glyph for
 * each of the front, side and rear deltoids would be false precision, and the
 * name is always shown next to it anyway.
 *
 * The first consumer is `ExerciseAnimation`, which draws the primary muscle
 * group's icon when an exercise has no animation file yet.
 */
export const ICON_BY_MUSCLE_GROUP: Record<MuscleGroup, LucideIcon> = {
  // Legs and hips: the standing figure.
  quadriceps: PersonStanding,
  hamstrings: PersonStanding,
  glutes: PersonStanding,
  adductors: PersonStanding,
  hipFlexors: PersonStanding,

  // The one leg muscle that is genuinely about the foot.
  calves: Footprints,

  // The spine itself, and the muscles that hold it up.
  spinalErectors: Bone,
  thoracicSpine: Bone,

  // The pulling muscles across the back: a broad curve.
  latissimusDorsi: Spline,
  midBack: Spline,

  // Head and shoulders, which is exactly what this programme is trying to fix.
  upperTraps: User,
  deepNeckFlexors: User,

  // The shoulder is a ball in a socket.
  frontDeltoids: CircleDot,
  sideDeltoids: CircleDot,
  rearDeltoids: CircleDot,

  chest: Shirt,

  biceps: BicepsFlexed,
  triceps: BicepsFlexed,

  forearmsAndGrip: HandGrab,

  // The trunk's job in this programme is to brace and resist, not to bend.
  abdominals: Shield,
  obliques: Shield,
};

/**
 * The icon for an exercise's headline muscle group.
 *
 * Falls back to the standing figure, which is the closest thing to "some
 * exercise" the set has, when an exercise names no primary muscle group.
 */
export function findIconForMuscleGroups(muscleGroups: readonly MuscleGroup[]): LucideIcon {
  const [primaryMuscleGroup] = muscleGroups;

  return primaryMuscleGroup === undefined
    ? PersonStanding
    : ICON_BY_MUSCLE_GROUP[primaryMuscleGroup];
}
