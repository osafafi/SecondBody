import { CalendarDays } from 'lucide-react';

import { ComingSoonPanel } from '@/components/ComingSoonPanel/ComingSoonPanel';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';

/**
 * The Schedule screen: planned versus completed sessions, and progress through
 * the current phase. Built in M6.
 */
export function ScheduleScreen() {
  return (
    <>
      <ScreenHeader
        title="Schedule"
        subtitle="Monday, Wednesday, Friday"
        leadingSlot={<IconBadge icon={<CalendarDays size={22} strokeWidth={1.75} />} isSolid />}
      />

      <ComingSoonPanel
        headline="Your training calendar"
        description="Which sessions are planned, which are done, and where you are in the 12-week programme."
        milestone="M6"
        icon={<CalendarDays size={24} strokeWidth={1.75} />}
      />
    </>
  );
}
