import { Dumbbell } from 'lucide-react';

import { ComingSoonPanel } from '@/components/ComingSoonPanel/ComingSoonPanel';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';

/**
 * The Today screen: what is on today, the streak, habit ticks and a quick weight
 * log. Built in M6.
 */
export function TodayScreen() {
  return (
    <>
      <ScreenHeader
        title="Today"
        subtitle="Let's get after it"
        leadingSlot={<IconBadge icon={<Dumbbell size={22} strokeWidth={1.75} />} isSolid />}
      />

      <ComingSoonPanel
        headline="Your daily briefing"
        description="Today's session, your streak, the habit checklist and a quick weight log will live here."
        milestone="M6"
        icon={<Dumbbell size={24} strokeWidth={1.75} />}
      />
    </>
  );
}
