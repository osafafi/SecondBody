import { useState } from 'react';
import { PenLine } from 'lucide-react';

import { GradientButton } from '@/components/GradientButton/GradientButton';
import { GradientSurface } from '@/components/GradientSurface/GradientSurface';
import {
  findJournalEntryProblems,
  MAXIMUM_JOURNAL_ENTRY_CHARACTERS,
  type JournalEntryDraft,
} from '@/domain/journalEntryDrafting';
import { JOURNAL_ENTRY_KINDS, type JournalEntryKind } from '@/types/journalTypes';

import { JOURNAL_ENTRY_KIND_HINTS, JOURNAL_ENTRY_KIND_LABELS } from '../journalWording';
import styles from './JournalComposerPanel.module.css';

/** One taggable thing, already turned into a label by the screen. */
export type JournalTagOption = {
  optionId: string;
  label: string;
};

export type JournalComposerPanelProps = {
  /** Today, from the screen's single reading of the clock. */
  todayIsoDate: string;

  /** Recent sessions, newest first. Empty before the first one is finished. */
  sessionOptions: JournalTagOption[];

  /** Exercises that can be tagged, given whichever session is selected. */
  resolveExerciseOptions: (selectedSessionId: string | null) => JournalTagOption[];

  isSaving: boolean;

  saveErrorMessage: string | null;

  onEntryWritten: (draft: JournalEntryDraft) => void;
};

/** The value the two selects use for "not tagged with anything". */
const NO_TAG_OPTION_ID = '';

/**
 * The thing that writes to the journal.
 *
 * Three deliberate choices, all of them about not getting in the way:
 *
 * - **The text box is first and it is big.** The kind, the day and the tags are
 *   under it, because the note is the point and everything else is filing.
 * - **Every field except the text has a working default.** A note about today,
 *   about nothing in particular, is one tap and a paragraph.
 * - **Nothing is validated while typing.** Problems appear when the button is
 *   pressed. A form that turns red halfway through a sentence about a sore knee
 *   is a form that teaches you not to write sentences about sore knees.
 */
export function JournalComposerPanel({
  todayIsoDate,
  sessionOptions,
  resolveExerciseOptions,
  isSaving,
  saveErrorMessage,
  onEntryWritten,
}: JournalComposerPanelProps) {
  const [bodyText, setBodyText] = useState('');
  const [entryKind, setEntryKind] = useState<JournalEntryKind>('reflection');
  const [aboutDate, setAboutDate] = useState(todayIsoDate);
  const [aboutSessionId, setAboutSessionId] = useState<string | null>(null);
  const [aboutExerciseId, setAboutExerciseId] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  const exerciseOptions = resolveExerciseOptions(aboutSessionId);

  const handleEntrySubmitted = () => {
    const draft: JournalEntryDraft = {
      bodyText,
      entryKind,
      aboutDate,
      aboutSessionId,
      aboutExerciseId,
    };

    const foundProblems = findJournalEntryProblems(draft, todayIsoDate);

    setProblems(foundProblems);

    if (foundProblems.length === 0) {
      onEntryWritten(draft);
    }
  };

  return (
    <GradientSurface as="section" variant="recessed" radius="xlarge" className={styles.panel}>
      <label className={styles.textField}>
        <span className={styles.fieldLabel}>What happened?</span>
        <textarea
          className={styles.textInput}
          rows={5}
          value={bodyText}
          maxLength={MAXIMUM_JOURNAL_ENTRY_CHARACTERS}
          placeholder="Knee was quiet on leg press for the first time in weeks. Still clicks on the way down."
          onChange={(event) => {
            setBodyText(event.target.value);
          }}
        />
      </label>

      <fieldset className={styles.kindField}>
        <legend className={styles.fieldLabel}>What kind of note is it?</legend>

        <div className={styles.kindOptions}>
          {JOURNAL_ENTRY_KINDS.map((kind) => (
            <label
              key={kind}
              className={[styles.kindOption, kind === entryKind ? styles.isSelected : '']
                .filter(Boolean)
                .join(' ')}
            >
              <input
                className={styles.hiddenRadio}
                type="radio"
                name="journal-entry-kind"
                value={kind}
                checked={kind === entryKind}
                onChange={() => {
                  setEntryKind(kind);
                }}
              />
              {JOURNAL_ENTRY_KIND_LABELS[kind]}
            </label>
          ))}
        </div>

        <p className={styles.kindHint}>{JOURNAL_ENTRY_KIND_HINTS[entryKind]}</p>
      </fieldset>

      <div className={styles.tagRow}>
        <label className={styles.tagField}>
          <span className={styles.fieldLabel}>Which day?</span>
          <input
            className={styles.tagInput}
            type="date"
            value={aboutDate}
            max={todayIsoDate}
            onChange={(event) => {
              setAboutDate(event.target.value);
            }}
          />
        </label>

        {sessionOptions.length > 0 ? (
          <label className={styles.tagField}>
            <span className={styles.fieldLabel}>About a session?</span>
            <select
              className={styles.tagInput}
              value={aboutSessionId ?? NO_TAG_OPTION_ID}
              onChange={(event) => {
                const selectedSessionId =
                  event.target.value === NO_TAG_OPTION_ID ? null : event.target.value;

                setAboutSessionId(selectedSessionId);

                /*
                 * The exercise list is drawn from the selected session, so a
                 * changed session can leave a tag pointing at a movement that
                 * is no longer on offer. Clearing it is more honest than
                 * silently storing it.
                 */
                setAboutExerciseId(null);
              }}
            >
              <option value={NO_TAG_OPTION_ID}>Not about one</option>
              {sessionOptions.map((option) => (
                <option key={option.optionId} value={option.optionId}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {exerciseOptions.length > 0 ? (
          <label className={styles.tagField}>
            <span className={styles.fieldLabel}>About a movement?</span>
            <select
              className={styles.tagInput}
              value={aboutExerciseId ?? NO_TAG_OPTION_ID}
              onChange={(event) => {
                setAboutExerciseId(
                  event.target.value === NO_TAG_OPTION_ID ? null : event.target.value,
                );
              }}
            >
              <option value={NO_TAG_OPTION_ID}>Not about one</option>
              {exerciseOptions.map((option) => (
                <option key={option.optionId} value={option.optionId}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <GradientButton tone="primary" isFullWidth disabled={isSaving} onClick={handleEntrySubmitted}>
        <PenLine size={18} strokeWidth={2} aria-hidden />
        {isSaving ? 'Saving' : 'Save this note'}
      </GradientButton>

      {problems.length > 0 ? (
        <ul className={styles.problemList} role="alert">
          {problems.map((problem) => (
            <li key={problem} className={styles.problem}>
              {problem}
            </li>
          ))}
        </ul>
      ) : null}

      {saveErrorMessage ? (
        <p className={styles.problem} role="alert">
          {saveErrorMessage}
        </p>
      ) : null}
    </GradientSurface>
  );
}
