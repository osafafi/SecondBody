import {
  Info,
  LogIn,
  MessageSquare,
  NotebookPen,
  Palette,
  Settings2,
  UserRound,
} from 'lucide-react';

import { useAuthentication } from '@/app/useAuthentication';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { exerciseMediaAttribution } from '@/content/exerciseMedia/exerciseMediaAttribution';

import { CoachingExportPanel } from './components/CoachingExportPanel';
import { CoachingPreferencesPanel } from './components/CoachingPreferencesPanel';
import { ColorPalettePicker } from './components/ColorPalettePicker';
import { ProfileDetailsPanel } from './components/ProfileDetailsPanel';
import { SignedInAccountPanel } from './components/SignedInAccountPanel';
import styles from './SettingsScreen.module.css';
import { useEditableProfile } from './useEditableProfile';
import { useCoachingBundleDownload } from './useCoachingBundleDownload';
import { useEditableUserSettings } from './useEditableUserSettings';

/**
 * Settings.
 *
 * M8 finished what M4 started. The preferences document has existed since the
 * data layer landed and every screen has been reading it; until now nothing
 * could write it, so every value in it was the default. All four sections here
 * are wired to something that actually changes behaviour.
 *
 * The credits section is not decoration and is not optional: the exercise
 * animations are used under terms that require this notice to travel with them.
 * See `src/content/exerciseMedia/exerciseMediaAttribution.ts`.
 */
export function SettingsScreen() {
  const { signedInUser } = useAuthentication();

  const {
    settingsStatus,
    userSettings,
    settingsErrorMessage,
    isSavingSettings,
    saveErrorMessage: settingsSaveErrorMessage,
    reloadUserSettings,
    changeUserSettings,
  } = useEditableUserSettings(signedInUser?.userId ?? null);

  const {
    userProfile,
    isSavingProfile,
    saveErrorMessage: profileSaveErrorMessage,
    hasJustSavedProfile,
    saveProfileEdits,
    forgetSaveResult,
  } = useEditableProfile();

  const { downloadStatus, downloadErrorMessage, downloadedFileName, downloadCoachingBundle } =
    useCoachingBundleDownload(signedInUser?.userId ?? null, userProfile);

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
          Changes apply everywhere immediately, and follow you to another device.
        </p>

        <ColorPalettePicker
          onPaletteSelected={(selectedPaletteId) => {
            changeUserSettings({ selectedPaletteId });
          }}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>
          <MessageSquare size={14} strokeWidth={2} aria-hidden />
          Coaching and sessions
        </h2>

        <p className={styles.sectionDescription}>
          How much Harout says, and what the session screen does with your phone.
        </p>

        {settingsStatus === 'loading' ? (
          <GradientSurface variant="outlined" radius="xlarge" className={styles.pendingPanel}>
            <p className={styles.pendingLabel} role="status">
              Reading your preferences
            </p>
          </GradientSurface>
        ) : null}

        {settingsStatus === 'failed' || (settingsStatus === 'ready' && !userSettings) ? (
          <GradientSurface variant="outlined" radius="xlarge" className={styles.errorPanel}>
            <h3 className={styles.errorTitle}>Could not read your preferences</h3>

            {settingsErrorMessage ? (
              <p className={styles.errorMessage} role="alert">
                {settingsErrorMessage}
              </p>
            ) : null}

            <GradientButton tone="primary" isFullWidth onClick={reloadUserSettings}>
              Try again
            </GradientButton>
          </GradientSurface>
        ) : null}

        {userSettings ? (
          <CoachingPreferencesPanel
            userSettings={userSettings}
            isSaving={isSavingSettings}
            saveErrorMessage={settingsSaveErrorMessage}
            onSettingsChanged={changeUserSettings}
          />
        ) : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>
          <UserRound size={14} strokeWidth={2} aria-hidden />
          Profile
        </h2>

        <p className={styles.sectionDescription}>
          The answers the programme is built on. Changing your training days or what hurts takes
          effect on the next session you start.
        </p>

        {/*
         * The profile comes from context and is watched for the life of the app,
         * so there is no loading state to render here — the onboarding gate this
         * screen sits behind cannot be passed without one.
         */}
        {userProfile ? (
          <ProfileDetailsPanel
            userProfile={userProfile}
            isSaving={isSavingProfile}
            saveErrorMessage={profileSaveErrorMessage}
            hasJustSaved={hasJustSavedProfile}
            onProfileSaved={saveProfileEdits}
            onEditStarted={forgetSaveResult}
          />
        ) : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>
          <NotebookPen size={14} strokeWidth={2} aria-hidden />
          Coaching export
        </h2>

        <p className={styles.sectionDescription}>
          Everything the app knows about your training, as one file to hand to somebody who can read
          it.
        </p>

        <CoachingExportPanel
          downloadStatus={downloadStatus}
          downloadErrorMessage={downloadErrorMessage}
          downloadedFileName={downloadedFileName}
          downloadCoachingBundle={downloadCoachingBundle}
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
