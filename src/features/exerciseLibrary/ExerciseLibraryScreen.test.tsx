import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { allExercises } from '@/content/exercises/allExercises';

import { ExerciseLibraryScreen } from './ExerciseLibraryScreen';

/**
 * No mocks at all, which is the point worth noticing: this screen reads only
 * committed content, so there is no Firestore to stand in for and no loading
 * state to wait out.
 *
 * `filterExerciseLibrary` has its own tests in `src/domain/`. What is tested
 * here is the wiring — that typing reaches the filter, that clearing puts
 * everything back, and that the chips and the search do not fight each other.
 */
function renderLibrary() {
  return render(
    <MemoryRouter>
      <ExerciseLibraryScreen />
    </MemoryRouter>,
  );
}

/** Every exercise row on screen, by the name it shows. */
function findVisibleExerciseNames(): string[] {
  return screen.getAllByRole('link').map((link) => link.textContent ?? '');
}

describe('opening the library', () => {
  it('lists every movement the app knows', () => {
    renderLibrary();

    expect(screen.getByRole('heading', { name: 'Exercise library', level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(allExercises.length);
  });

  it('says how big the library is', () => {
    renderLibrary();

    expect(screen.getByText(`${String(allExercises.length)} movements`)).toBeInTheDocument();
  });

  it('links each movement to its own page', () => {
    renderLibrary();

    expect(screen.getByRole('link', { name: /Lat Pulldown/i })).toHaveAttribute(
      'href',
      '/library/latPulldown',
    );
  });
});

describe('searching', () => {
  it('narrows the list to what was typed', async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.type(screen.getByRole('searchbox'), 'lat pulldown');

    const visibleNames = findVisibleExerciseNames();

    expect(visibleNames.length).toBeLessThan(allExercises.length);
    expect(visibleNames.join(' ')).toContain('Lat Pulldown');
  });

  it('keeps the total in view while a search is narrowing it', async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.type(screen.getByRole('searchbox'), 'lat pulldown');

    expect(
      screen.getByText(new RegExp(`of ${String(allExercises.length)} movements`)),
    ).toBeInTheDocument();
  });

  it('says so rather than showing an empty page when nothing matches', async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.type(screen.getByRole('searchbox'), 'zzzznotamovement');

    expect(screen.getByRole('heading', { name: /nothing matches that/i })).toBeInTheDocument();
  });

  it('puts everything back when the search is cleared', async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.type(screen.getByRole('searchbox'), 'lat pulldown');
    await user.click(screen.getByRole('button', { name: /clear the search/i }));

    expect(screen.getAllByRole('link')).toHaveLength(allExercises.length);
  });
});

describe('filtering by kind of movement', () => {
  it('narrows to one kind', async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole('button', { name: 'Cardio' }));

    expect(screen.getByRole('button', { name: 'Cardio' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('link').length).toBeLessThan(allExercises.length);
  });

  it('clears the filter when the selected chip is tapped again', async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole('button', { name: 'Cardio' }));
    await user.click(screen.getByRole('button', { name: 'Cardio' }));

    expect(screen.getAllByRole('link')).toHaveLength(allExercises.length);
  });

  it('applies the chip and the search together', async () => {
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole('button', { name: 'Cardio' }));
    await user.type(screen.getByRole('searchbox'), 'lat pulldown');

    /* A strength movement, looked for while the cardio chip is on. */
    expect(screen.getByRole('heading', { name: /nothing matches that/i })).toBeInTheDocument();
  });
});
