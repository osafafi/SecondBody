import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // HashRouter reads the hash, so reset it between tests.
    window.location.hash = '';
  });

  it('opens on the Today screen', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument();
  });

  it('shows all four navigation destinations', () => {
    render(<App />);

    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });

    for (const destinationName of ['Today', 'Schedule', 'Progress', 'Settings']) {
      expect(screen.getByRole('link', { name: destinationName })).toBeInTheDocument();
    }

    expect(navigation).toBeInTheDocument();
  });

  it('navigates to Settings when the Settings tab is tapped', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Settings' }));

    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
  });
});
