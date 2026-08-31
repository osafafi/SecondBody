import { BatteryLow, Gauge, Zap, type LucideIcon } from 'lucide-react';

import type { OverallSessionFeeling } from '@/types/trainingHistoryTypes';

/**
 * One icon per answer to "how was that session overall", and the words beside
 * it. See docs/DESIGN_SYSTEM.md section 7.
 *
 * Distinct from the per-set effort ratings in `effortRatingIcons.ts` on purpose.
 * A set is rated so the app knows what weight to prescribe next; a session is
 * rated so a run of rough ones is visible later. Sharing icons between the two
 * would suggest they are the same scale, and they are not.
 */

export type SessionFeelingPresentation = {
  icon: LucideIcon;
  label: string;
};

export const PRESENTATION_BY_SESSION_FEELING: Record<
  OverallSessionFeeling,
  SessionFeelingPresentation
> = {
  strong: { icon: Zap, label: 'Strong' },
  normal: { icon: Gauge, label: 'Normal' },
  rough: { icon: BatteryLow, label: 'Rough' },
};
