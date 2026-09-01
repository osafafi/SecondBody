/**
 * Runs once before every Vitest file.
 * Adds the `@testing-library/jest-dom` matchers (`toBeInTheDocument`, etc.).
 */
import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

/**
 * jsdom declares `window.scrollTo` and then throws "Not implemented" when it is
 * called, which prints a stack trace into the output of every test that renders
 * the app shell — the shell scrolls each new screen to the top.
 *
 * Stubbed rather than guarded at the call site: there is nothing to guard
 * against in a browser, and a `typeof` check in `AppShell` would be production
 * code apologising for a test environment. A real browser's scroll position is
 * not something jsdom models, so there is nothing here worth asserting on
 * either.
 */
vi.stubGlobal(
  'scrollTo',
  vi.fn(() => {
    /* Deliberately does nothing. jsdom has no viewport to scroll. */
  }),
);
