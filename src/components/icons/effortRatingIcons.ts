import { Flame, Smile, ThumbsUp, type LucideIcon } from 'lucide-react';

import type { EffortRating } from '@/types/trainingVocabulary';

/**
 * One icon per effort rating, and the words that go beside it.
 *
 * These three answers are the whole of auto-regulation — see
 * docs/TRAINING_PROGRAM.md section 7 — so they are asked after every set and
 * have to be readable and tappable with a heart rate. Colour alone never says
 * which is which: docs/DESIGN_SYSTEM.md section 8 requires the icon and the
 * label, and the words are the part that carries the meaning.
 *
 * The labels deliberately describe how the set *felt* rather than what the app
 * will do about it. "Brutal" is not a failure, and it should not read as one.
 */

export type EffortRatingPresentation = {
  icon: LucideIcon;

  /** What the button says. */
  label: string;

  /** The short line under it, saying what that answer means. */
  description: string;
};

export const PRESENTATION_BY_EFFORT_RATING: Record<EffortRating, EffortRatingPresentation> = {
  easy: {
    icon: Smile,
    label: 'Easy',
    description: 'Could have kept going',
  },
  justRight: {
    icon: ThumbsUp,
    label: 'Just right',
    description: 'Worked, but under control',
  },
  brutal: {
    icon: Flame,
    label: 'Brutal',
    description: 'That was everything I had',
  },
};
