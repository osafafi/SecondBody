import { describe, expect, it } from 'vitest';

import { isPopupUnavailableError } from './popupSignInFallback';

/**
 * Whether a failed popup should become a redirect.
 *
 * The two cancellation cases are the ones worth protecting. Treating them as
 * "popup unavailable" would send someone who just closed the popup on a
 * full-page redirect to Google, which reads as the app refusing to take no for
 * an answer.
 */
describe('deciding whether to fall back to redirect sign-in', () => {
  it('falls back when the browser blocked the popup', () => {
    expect(isPopupUnavailableError({ code: 'auth/popup-blocked' })).toBe(true);
  });

  it('falls back when the environment cannot show a popup at all', () => {
    expect(
      isPopupUnavailableError({ code: 'auth/operation-not-supported-in-this-environment' }),
    ).toBe(true);
  });

  it('does not fall back when the user closed the popup themselves', () => {
    expect(isPopupUnavailableError({ code: 'auth/popup-closed-by-user' })).toBe(false);
  });

  it('does not fall back when a second popup superseded the first', () => {
    expect(isPopupUnavailableError({ code: 'auth/cancelled-popup-request' })).toBe(false);
  });

  it('does not fall back on an unrelated auth failure', () => {
    expect(isPopupUnavailableError({ code: 'auth/unauthorized-domain' })).toBe(false);
  });

  it('handles things thrown that are not Firebase errors at all', () => {
    expect(isPopupUnavailableError(new Error('network down'))).toBe(false);
    expect(isPopupUnavailableError('auth/popup-blocked')).toBe(false);
    expect(isPopupUnavailableError(null)).toBe(false);
    expect(isPopupUnavailableError(undefined)).toBe(false);
    expect(isPopupUnavailableError({ code: 42 })).toBe(false);
  });
});
