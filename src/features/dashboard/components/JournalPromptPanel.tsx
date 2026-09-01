import { NotebookPen } from 'lucide-react';
import { Link } from 'react-router-dom';

import { APP_ROUTE_PATHS } from '@/app/appRoutes';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';

import styles from './JournalPromptPanel.module.css';

export type JournalPromptPanelProps = {
  /** One line from Harout, or null. Null renders the panel without a line. */
  coachLine: string | null;
};

/**
 * The way into the journal, from the screen the app opens on.
 *
 * **It reads nothing.** Today is the most-opened screen in the app and already
 * makes two round trips before it can draw anything; a count of journal entries
 * on it would be a third read to render a number nobody needs. So this is a
 * prompt and a link, and the journal does its own reading when it is opened.
 */
export function JournalPromptPanel({ coachLine }: JournalPromptPanelProps) {
  return (
    <GradientSurface as="section" variant="glass" radius="xlarge" className={styles.panel}>
      <div className={styles.headlineText}>
        <h2 className={styles.title}>Journal</h2>
        <p className={styles.description}>
          {coachLine ?? 'Anything worth writing down goes here.'}
        </p>
      </div>

      <Link className={styles.journalLink} to={APP_ROUTE_PATHS.journal}>
        <NotebookPen size={18} strokeWidth={2} aria-hidden />
        Write something down
      </Link>
    </GradientSurface>
  );
}
