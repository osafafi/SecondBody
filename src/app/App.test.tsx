import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

/**
 * Toolchain smoke test: proves React, TypeScript, jsdom and Testing Library
 * are all wired together correctly. Real feature tests arrive with their features.
 */
describe('App', () => {
  it('renders the application name', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'second body' })).toBeInTheDocument();
  });
});
