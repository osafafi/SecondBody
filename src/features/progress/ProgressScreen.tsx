import { TrendingUp } from 'lucide-react';

import { ComingSoonPanel } from '@/components/ComingSoonPanel/ComingSoonPanel';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';

/**
 * The Progress screen: weight trend, training volume and personal records.
 * Built in M7.
 */
export function ProgressScreen() {
  return (
    <>
      <ScreenHeader
        title="Progress"
        subtitle="The numbers that matter"
        leadingSlot={<IconBadge icon={<TrendingUp size={22} strokeWidth={1.75} />} isSolid />}
      />

      <ComingSoonPanel
        headline="Proof it is working"
        description="Weight as a 7-day rolling average, training volume over time, and every personal record."
        milestone="M7"
        icon={<TrendingUp size={24} strokeWidth={1.75} />}
      />
    </>
  );
}
