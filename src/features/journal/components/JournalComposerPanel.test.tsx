import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { JournalComposerPanel, type JournalTagOption } from './JournalComposerPanel';

/**
 * The composer owns three behaviours worth protecting, and none of them are
 * about what a valid entry is — `journalEntryDrafting.test.ts` owns that, and
 * this renders the real validator rather than a stub so the two cannot drift.
 *
 * What is tested here is the part a user would notice: nothing is refused until
 * the button is pressed, what reaches the caller is exactly what was typed, and
 * changing the session does not leave a movement tag pointing at a session that
 * no longer contains it.
 */

const TODAY = '2026-09-01';

const SESSION_OPTIONS: JournalTagOption[] = [
  { optionId: 'session-1', label: 'Session A, today' },
  { optionId: 'session-2', label: 'Session C, Friday' },
];

function renderComposer(onEntryWritten = vi.fn()) {
  render(
    <JournalComposerPanel
      todayIsoDate={TODAY}
      sessionOptions={SESSION_OPTIONS}
      resolveExerciseOptions={(selectedSessionId) =>
        selectedSessionId === 'session-2'
          ? [{ optionId: 'latPulldown', label: 'Lat pulldown' }]
          : [{ optionId: 'legPress', label: 'Leg press' }]
      }
      isSaving={false}
      saveErrorMessage={null}
      onEntryWritten={onEntryWritten}
    />,
  );

  return { onEntryWritten };
}

describe('writing a note', () => {
  it('sends what was typed, tagged with nothing by default', async () => {
    const { onEntryWritten } = renderComposer();

    await userEvent.type(screen.getByLabelText('What happened?'), 'Knee was quiet today.');
    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    expect(onEntryWritten).toHaveBeenCalledWith({
      bodyText: 'Knee was quiet today.',
      entryKind: 'reflection',
      aboutDate: TODAY,
      aboutSessionId: null,
      aboutExerciseId: null,
    });
  });

  it('carries the kind that was picked', async () => {
    const { onEntryWritten } = renderComposer();

    await userEvent.type(screen.getByLabelText('What happened?'), 'Shoulder felt pinchy.');
    await userEvent.click(screen.getByRole('radio', { name: 'Concern' }));
    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    expect(onEntryWritten).toHaveBeenCalledWith(
      expect.objectContaining({ entryKind: 'concern' }) as unknown,
    );
  });

  it('carries the session and the movement it was tagged with', async () => {
    const { onEntryWritten } = renderComposer();

    await userEvent.type(screen.getByLabelText('What happened?'), 'Felt strong.');
    await userEvent.selectOptions(screen.getByLabelText('About a session?'), 'session-1');
    await userEvent.selectOptions(screen.getByLabelText('About a movement?'), 'legPress');
    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    expect(onEntryWritten).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutSessionId: 'session-1',
        aboutExerciseId: 'legPress',
      }) as unknown,
    );
  });
});

describe('when the note is not usable', () => {
  it('says nothing at all until the button is pressed', async () => {
    renderComposer();

    await userEvent.click(screen.getByLabelText('What happened?'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('refuses an empty note and says why', async () => {
    const { onEntryWritten } = renderComposer();

    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Write something first.');
    expect(onEntryWritten).not.toHaveBeenCalled();
  });
});

describe('changing which session a note is about', () => {
  /*
   * The movement list is drawn from the selected session, so a changed session
   * can leave a tag pointing at a movement that is no longer on offer. Storing
   * it silently would put a leg press on a pulling session in the bundle.
   */
  it('clears the movement tag, rather than storing one from the old session', async () => {
    const { onEntryWritten } = renderComposer();

    await userEvent.type(screen.getByLabelText('What happened?'), 'Second set was rough.');
    await userEvent.selectOptions(screen.getByLabelText('About a session?'), 'session-1');
    await userEvent.selectOptions(screen.getByLabelText('About a movement?'), 'legPress');

    await userEvent.selectOptions(screen.getByLabelText('About a session?'), 'session-2');
    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    expect(onEntryWritten).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutSessionId: 'session-2',
        aboutExerciseId: null,
      }) as unknown,
    );
  });
});

describe('before the first session is finished', () => {
  it('offers no session picker rather than an empty one', () => {
    render(
      <JournalComposerPanel
        todayIsoDate={TODAY}
        sessionOptions={[]}
        resolveExerciseOptions={() => []}
        isSaving={false}
        saveErrorMessage={null}
        onEntryWritten={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('About a session?')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('About a movement?')).not.toBeInTheDocument();
    expect(screen.getByLabelText('What happened?')).toBeInTheDocument();
  });
});
