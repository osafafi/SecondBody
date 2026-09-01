import { Download } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';

import type { CoachingBundleDownloadState } from '../useCoachingBundleDownload';
import styles from './CoachingExportPanel.module.css';

export type CoachingExportPanelProps = Pick<
  CoachingBundleDownloadState,
  'downloadStatus' | 'downloadErrorMessage' | 'downloadedFileName' | 'downloadCoachingBundle'
>;

/**
 * The way out of the app, for a conversation that happens outside it.
 *
 * The bundle is everything the app knows: the programme, every session, the
 * scale, the habits, the records and every journal entry. That is a fact worth
 * saying on the screen rather than only in a document — it is personal data
 * leaving a phone, and the person pressing the button should know what is in
 * the file before it is in their downloads folder.
 */
export function CoachingExportPanel({
  downloadStatus,
  downloadErrorMessage,
  downloadedFileName,
  downloadCoachingBundle,
}: CoachingExportPanelProps) {
  return (
    <GradientSurface as="section" variant="outlined" radius="xlarge" className={styles.panel}>
      <p className={styles.description}>
        One file with everything in it: your programme, every session, the scale, the habits, your
        records and every note in the journal. It is meant for talking your training over with a
        coach who was not there.
      </p>

      <GradientButton
        tone="secondary"
        isFullWidth
        disabled={downloadStatus === 'preparing'}
        onClick={downloadCoachingBundle}
      >
        <Download size={18} strokeWidth={2} aria-hidden />
        {downloadStatus === 'preparing' ? 'Gathering everything' : 'Download my training data'}
      </GradientButton>

      {downloadStatus === 'ready' && downloadedFileName ? (
        <p className={styles.resultMessage} role="status">
          Saved as {downloadedFileName}.
        </p>
      ) : null}

      {downloadStatus === 'failed' && downloadErrorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {downloadErrorMessage}
        </p>
      ) : null}

      <p className={styles.description}>
        On a laptop with the repository checked out, this is the same file:
      </p>

      <p className={styles.commandLine}>npm run coach:export</p>
    </GradientSurface>
  );
}
