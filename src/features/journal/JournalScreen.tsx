import { NotebookPen } from 'lucide-react';

import { useAuthentication } from '@/app/useAuthentication';
import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import { IconBadge } from '@/components/IconBadge/IconBadge';
import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader';
import { findCoachLinesByCategory } from '@/content/coachVoice/allCoachLines';
import { findExerciseById } from '@/content/exercises/allExercises';
import { formatIsoDate } from '@/domain/calendarDates';
import { selectCoachLine } from '@/domain/coachLineSelection';
import { useTrainingOverview } from '@/hooks/useTrainingOverview';
import type { JournalEntry } from '@/types/journalTypes';
import type { WithDocumentId, WorkoutSession } from '@/types/trainingHistoryTypes';

import { JournalComposerPanel, type JournalTagOption } from './components/JournalComposerPanel';
import { JournalEntryList, type JournalEntryRow } from './components/JournalEntryList';
import styles from './JournalScreen.module.css';
import { describeEntryCount } from './journalWording';
import { useJournal } from './useJournal';

/**
 * The journal: what he wrote down during the week.
 *
 * This is the capture half of M10. Nothing on this screen is analysed, scored
 * or summarised — it is written, stored verbatim, and read back. The half that
 * does something with it happens somewhere else entirely: `coachingBundle.ts`
 * gathers it up, and the conversation takes place in Claude Code with the
 * bundle in front of it. The app is the memory, not the coach's brain.
 *
 * It is not in the bottom navigation. Four targets across a phone is
 * comfortable and five is fiddly — the note on `BottomNavigation` — so the way
 * in is the panel on Today, the same shape as the exercise library.
 */
export function JournalScreen() {
  const { signedInUser } = useAuthentication();
  const signedInUserId = signedInUser?.userId ?? null;

  const {
    journalStatus,
    journalEntries,
    taggableSessions,
    journalErrorMessage,
    isSavingEntry,
    saveErrorMessage,
    savedEntryCount,
    reloadJournal,
    saveJournalEntry,
  } = useJournal(signedInUserId);

  /*
   * Only for the coach line's rotation. The journal itself needs nothing from
   * the programme, and this hook is already loaded and cached by the time
   * anyone reaches this screen from Today.
   */
  const { trainingOverview } = useTrainingOverview(signedInUserId);

  /* One reading of the clock for the whole screen. See the note on `TodayScreen`. */
  const todayIsoDate = formatIsoDate(new Date());

  const coachLine = selectCoachLine({
    candidateLines: findCoachLinesByCategory(
      savedEntryCount > 0 ? 'journalEntrySaved' : 'journalPrompt',
    ),
    configuredVerbosity: trainingOverview?.userSettings.coachVerbosity ?? 'standard',
    rotationIndex: savedEntryCount + (journalEntries?.length ?? 0),
    mayUsePraise: false,
  });

  return (
    <>
      <ScreenHeader
        title="Journal"
        subtitle={
          journalEntries === null
            ? 'Whatever is worth remembering'
            : describeEntryCount(journalEntries.length)
        }
        leadingSlot={<IconBadge icon={<NotebookPen size={22} strokeWidth={1.75} />} isSolid />}
      />

      <div className={styles.body}>
        {journalStatus === 'loading' ? (
          <GradientSurface variant="outlined" radius="xlarge" className={styles.pendingPanel}>
            <p className={styles.pendingLabel} role="status">
              Reading what you have written
            </p>
          </GradientSurface>
        ) : null}

        {journalStatus === 'failed' || (journalStatus === 'ready' && journalEntries === null) ? (
          <GradientSurface variant="outlined" radius="xlarge" className={styles.errorPanel}>
            <h2 className={styles.errorTitle}>Could not read your journal</h2>

            {journalErrorMessage ? (
              <p className={styles.errorMessage} role="alert">
                {journalErrorMessage}
              </p>
            ) : null}

            <GradientButton tone="primary" isFullWidth onClick={reloadJournal}>
              Try again
            </GradientButton>
          </GradientSurface>
        ) : null}

        {journalEntries ? (
          <>
            <JournalComposerPanel
              /*
               * Keyed on the number of entries that have landed, so a
               * successful save empties the form by remounting it. Remounting
               * is the honest way to reset a form from the outside — the same
               * trick, and the same reason, as the quick weigh-in on Today.
               */
              key={`journal-entry-${String(savedEntryCount)}`}
              todayIsoDate={todayIsoDate}
              sessionOptions={buildSessionOptions(taggableSessions, todayIsoDate)}
              resolveExerciseOptions={(selectedSessionId) =>
                buildExerciseOptions(taggableSessions, selectedSessionId)
              }
              isSaving={isSavingEntry}
              saveErrorMessage={saveErrorMessage}
              onEntryWritten={saveJournalEntry}
            />

            <JournalEntryList
              entries={buildEntryRows(journalEntries, taggableSessions)}
              todayIsoDate={todayIsoDate}
              emptyStateCoachLine={coachLine?.text ?? null}
            />
          </>
        ) : null}
      </div>
    </>
  );
}

/** "Session A, Monday" — enough to recognise which one without a date column. */
function buildSessionOptions(
  sessions: readonly WithDocumentId<WorkoutSession>[],
  todayIsoDate: string,
): JournalTagOption[] {
  const weekdayFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });

  return sessions.map((session) => ({
    optionId: session.documentId,
    label:
      formatIsoDate(session.startedAt) === todayIsoDate
        ? `Session ${session.sessionLetter}, today`
        : `Session ${session.sessionLetter}, ${weekdayFormatter.format(session.startedAt)}`,
  }));
}

/**
 * The movements that can be tagged.
 *
 * From the selected session when there is one, and from every recent session
 * when there is not — because "my knee clicks on leg press" is a fact about a
 * movement rather than about one afternoon, and the domain allows an exercise
 * tag with no session behind it.
 */
function buildExerciseOptions(
  sessions: readonly WithDocumentId<WorkoutSession>[],
  selectedSessionId: string | null,
): JournalTagOption[] {
  const relevantSessions =
    selectedSessionId === null
      ? sessions
      : sessions.filter((session) => session.documentId === selectedSessionId);

  const exerciseIds = new Set(
    relevantSessions.flatMap((session) =>
      session.performedExercises.map((exercise) => exercise.exerciseId),
    ),
  );

  return [...exerciseIds].map((exerciseId) => ({
    optionId: exerciseId,
    label: findExerciseById(exerciseId)?.shortDisplayName ?? exerciseId,
  }));
}

/**
 * Stored entries with their tags resolved to something readable.
 *
 * A session older than the handful read back resolves to null rather than to a
 * placeholder, so the list shows the note without a label it cannot justify.
 */
function buildEntryRows(
  entries: readonly WithDocumentId<JournalEntry>[],
  sessions: readonly WithDocumentId<WorkoutSession>[],
): JournalEntryRow[] {
  const sessionsById = new Map(sessions.map((session) => [session.documentId, session]));

  return entries.map((entry) => {
    const taggedSession =
      entry.aboutSessionId === null ? undefined : sessionsById.get(entry.aboutSessionId);

    return {
      entryId: entry.documentId,
      entryKind: entry.entryKind,
      aboutDate: entry.aboutDate,
      bodyText: entry.bodyText,
      sessionLabel:
        taggedSession === undefined
          ? null
          : `Session ${taggedSession.sessionLetter}, week ${String(taggedSession.weekNumber)}`,
      exerciseName:
        entry.aboutExerciseId === null
          ? null
          : (findExerciseById(entry.aboutExerciseId)?.shortDisplayName ?? entry.aboutExerciseId),
    };
  });
}
