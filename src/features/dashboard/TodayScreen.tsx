import { Link } from 'react-router-dom';
import { ChevronRight, Dumbbell, Play } from 'lucide-react';

import { APP_ROUTE_PATHS } from '@/app/appRoutes';
import { ComingSoonPanel } from '@/components/ComingSoonPanel/ComingSoonPanel';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';

import styles from './TodayScreen.module.css';

/**
 * The Today screen: what is on today, the streak, habit ticks and a quick
 * weight log. Built in M6.
 *
 * The one thing here already is the way into a session. M5 built the player and
 * it has to be reachable from somewhere — the session card below is deliberately
 * the smallest thing that does that, and M6 replaces it with the real briefing
 * that knows which session is due and whether today is a training day.
 */
export function TodayScreen() {
  return (
    <>
      <ScreenHeader
        title="Today"
        subtitle="Let's get after it"
        leadingSlot={<IconBadge icon={<Dumbbell size={22} strokeWidth={1.75} />} isSolid />}
      />

      <GradientSurface as="section" variant="accent" radius="xlarge" className={styles.sessionCard}>
        <div className={styles.sessionText}>
          <p className={styles.sessionLabel}>Next session</p>
          <h2 className={styles.sessionTitle}>Pick up where the programme is</h2>
          <p className={styles.sessionDescription}>
            The warm-up, every set and the weight for each one.
          </p>
        </div>

        <Link className={styles.startLink} to={APP_ROUTE_PATHS.activeSession}>
          <Play size={18} strokeWidth={2.5} aria-hidden />
          Start the session
          <ChevronRight size={18} strokeWidth={2.5} aria-hidden />
        </Link>
      </GradientSurface>

      <ComingSoonPanel
        headline="Your daily briefing"
        description="Your streak, the habit checklist and a quick weight log will live here."
        milestone="M6"
        icon={<Dumbbell size={24} strokeWidth={1.75} />}
      />
    </>
  );
}
