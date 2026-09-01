import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_USER_SETTINGS } from '@/types/userAccountTypes';

import { JournalScreen } from './JournalScreen';

/**
 * Firebase is mocked out entirely, for the reason `App.test.tsx` spells out:
 * there is nothing here worth testing about Firestore, and CLAUDE.md section 5
 * says so. What is worth testing is the wiring — that a saved note reaches the
 * list, that a failed read offers a way back, and that the coach says the right
 * one of two things.
 *
 * `vi.hoisted` because `vi.mock` factories are lifted above the imports.
 */
const backend = vi.hoisted(() => ({
  storedEntries: [] as unknown[],
  shouldReadFail: false,
  shouldWriteFail: false,
  addedEntries: [] as unknown[],
}));

vi.mock('@/app/useAuthentication', () => ({
  useAuthentication: () => ({
    signedInUser: { userId: 'user-1', displayName: 'Omar' },
  }),
}));

vi.mock('@/services/repositories/journalEntriesRepository', () => ({
  readRecentJournalEntries: () =>
    backend.shouldReadFail
      ? Promise.reject(new Error('offline'))
      : Promise.resolve(backend.storedEntries),
  addJournalEntry: (_userId: string, entry: unknown) => {
    if (backend.shouldWriteFail) {
      return Promise.reject(new Error('offline'));
    }

    backend.addedEntries.push(entry);

    return Promise.resolve(`entry-${String(backend.addedEntries.length)}`);
  },
}));

vi.mock('@/services/repositories/workoutSessionRepository', () => ({
  readRecentWorkoutSessions: () => Promise.resolve([]),
}));

vi.mock('@/services/repositories/userSettingsRepository', () => ({
  readUserSettings: () => Promise.resolve({ ...DEFAULT_USER_SETTINGS, updatedAt: new Date() }),
}));

beforeEach(() => {
  backend.storedEntries = [];
  backend.shouldReadFail = false;
  backend.shouldWriteFail = false;
  backend.addedEntries = [];
});

describe('opening the journal', () => {
  it('invites a note when nothing has been written', async () => {
    render(<JournalScreen />);

    expect(await screen.findByText('Nothing written down yet')).toBeInTheDocument();
    expect(screen.getByText(/a sentence is plenty/i)).toBeInTheDocument();
  });

  it('shows what is already there', async () => {
    backend.storedEntries = [
      {
        documentId: 'entry-1',
        bodyText: 'Knee was quiet today.',
        entryKind: 'reflection',
        aboutDate: '2026-09-01',
        writtenAt: new Date('2026-09-01T20:00:00'),
        aboutSessionId: null,
        aboutExerciseId: null,
        reviewStatus: 'awaitingReview',
        reviewedAt: null,
      },
    ];

    render(<JournalScreen />);

    expect(await screen.findByText('Knee was quiet today.')).toBeInTheDocument();
    expect(screen.getByText('1 note')).toBeInTheDocument();
  });

  it('offers a way back when the read fails', async () => {
    backend.shouldReadFail = true;

    render(<JournalScreen />);

    expect(await screen.findByText('Could not read your journal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('writing a note', () => {
  it('stores it and puts it in the list', async () => {
    render(<JournalScreen />);

    await userEvent.type(
      await screen.findByLabelText('What happened?'),
      'Shoulder felt tight on the second set.',
    );
    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    expect(await screen.findByText('Shoulder felt tight on the second set.')).toBeInTheDocument();
    expect(backend.addedEntries).toHaveLength(1);
  });

  it('acknowledges the save without congratulating anybody', async () => {
    render(<JournalScreen />);

    await userEvent.type(await screen.findByLabelText('What happened?'), 'Felt strong.');
    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/saved|got it|written down/i);
    expect(screen.queryByText(/a sentence is plenty/i)).not.toBeInTheDocument();
  });

  it('empties the composer once the note has landed', async () => {
    render(<JournalScreen />);

    await userEvent.type(await screen.findByLabelText('What happened?'), 'Felt strong.');
    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('What happened?')).toHaveValue('');
    });
  });

  /*
   * The one write in this app that is not optimistic. A paragraph that appeared
   * and then vanished would have thrown away something that only existed in the
   * person's head, so the text stays put until Firestore has taken it.
   */
  it('keeps what was typed when the write fails', async () => {
    backend.shouldWriteFail = true;

    render(<JournalScreen />);

    await userEvent.type(await screen.findByLabelText('What happened?'), 'Knee clicked again.');
    await userEvent.click(screen.getByRole('button', { name: /save this note/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('What happened?')).toHaveValue('Knee clicked again.');

    // Still empty, so the note that failed to save did not reach the list either.
    expect(screen.getByText('Nothing written down yet')).toBeInTheDocument();
  });
});
