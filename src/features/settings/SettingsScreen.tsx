import { Palette, Settings2, UserRound } from 'lucide-react';

import { ComingSoonPanel } from '@/components/ComingSoonPanel/ComingSoonPanel';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';

import { ColorPalettePicker } from './components/ColorPalettePicker';
import styles from './SettingsScreen.module.css';

/**
 * Settings.
 *
 * The colour palette picker is fully working. Profile editing, targets and coach
 * verbosity arrive in M8 once there is a backend to store them in.
 */
export function SettingsScreen() {
  return (
    <>
      <ScreenHeader
        title="Settings"
        subtitle="Make it yours"
        leadingSlot={<IconBadge icon={<Settings2 size={22} strokeWidth={1.75} />} isSolid />}
      />

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>
          <Palette size={14} strokeWidth={2} aria-hidden />
          Appearance
        </h2>

        <p className={styles.sectionDescription}>
          Changes apply everywhere immediately, including the exercise animations.
        </p>

        <ColorPalettePicker />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>
          <UserRound size={14} strokeWidth={2} aria-hidden />
          Profile
        </h2>

        <ComingSoonPanel
          headline="Your details"
          description="Height, weight targets, training days, pain areas and how chatty you want the coach to be."
          milestone="M8"
          icon={<UserRound size={24} strokeWidth={1.75} />}
        />
      </section>
    </>
  );
}
