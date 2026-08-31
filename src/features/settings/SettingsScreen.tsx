import { Info, LogIn, Palette, Settings2, UserRound } from 'lucide-react';

import { ComingSoonPanel } from '@/components/ComingSoonPanel/ComingSoonPanel';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { exerciseMediaAttribution } from '@/content/exerciseMedia/exerciseMediaAttribution';

import { ColorPalettePicker } from './components/ColorPalettePicker';
import { SignedInAccountPanel } from './components/SignedInAccountPanel';
import styles from './SettingsScreen.module.css';

/**
 * Settings.
 *
 * The colour palette picker and the account panel are fully working. Profile
 * editing, targets and coach verbosity arrive in M8 — the backend they need
 * landed in M4, but the screens to edit them did not.
 *
 * The credits section is not decoration and is not optional: the exercise
 * animations are used under terms that require this notice to travel with them.
 * See `src/content/exerciseMedia/exerciseMediaAttribution.ts`.
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

        <p className={styles.sectionDescription}>Changes apply everywhere immediately.</p>

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

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>
          <LogIn size={14} strokeWidth={2} aria-hidden />
          Account
        </h2>

        <SignedInAccountPanel />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>
          <Info size={14} strokeWidth={2} aria-hidden />
          Credits
        </h2>

        <GradientSurface variant="outlined" className={styles.creditsPanel}>
          {/*
           * The notice is the link text rather than sitting beside a second
           * copy of the same name. It has to appear verbatim, and it reads as
           * one phrase — "Exercise animations © Gym visual" — rather than
           * saying "Gym visual" twice in six words.
           */}
          <p className={styles.creditsLine}>
            Exercise animations{' '}
            <a
              className={styles.creditsLink}
              href={exerciseMediaAttribution.rightsHolderUrl}
              target="_blank"
              rel="noreferrer"
            >
              {exerciseMediaAttribution.noticeText}
            </a>
          </p>

          <p className={styles.creditsLine}>
            Collected in{' '}
            <a
              className={styles.creditsLink}
              href={exerciseMediaAttribution.datasetUrl}
              target="_blank"
              rel="noreferrer"
            >
              {exerciseMediaAttribution.datasetName}
            </a>
          </p>
        </GradientSurface>
      </section>
    </>
  );
}
