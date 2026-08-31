import { useEffect, useState } from 'react';

/**
 * Keeps the screen on.
 *
 * A phone that dims after thirty seconds is genuinely annoying between sets:
 * the prescribed weight is on the screen, both hands are busy, and unlocking it
 * with a thumb that has just been on a knurled handle is a coin flip. This is
 * one of the extras Omar asked for by name — see the locked decisions table in
 * docs/PROGRESS.md.
 *
 * Two things about the Screen Wake Lock API make this more than one call:
 *
 * 1. **The browser releases the lock whenever the page is hidden.** Switching
 *    to a podcast app and coming back would otherwise leave the screen dimming
 *    again, silently. So it is re-acquired on every return to visibility.
 * 2. **It is not available everywhere**, and it is not available at all over
 *    plain HTTP. Nothing here should break when it is missing — the app simply
 *    behaves the way it did before, and says so rather than pretending.
 */

export type ScreenWakeLockState = {
  /** True when this browser has the API at all. */
  isSupported: boolean;

  /** True while a lock is actually held. */
  isHoldingLock: boolean;
};

function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/**
 * Holds a screen wake lock for as long as `shouldKeepScreenAwake` is true.
 *
 * Released on unmount, so leaving the session screen gives the phone its normal
 * behaviour back without anything having to remember to ask.
 */
export function useScreenWakeLock(shouldKeepScreenAwake: boolean): ScreenWakeLockState {
  const [isHoldingLock, setIsHoldingLock] = useState(false);

  useEffect(() => {
    if (!shouldKeepScreenAwake || !isWakeLockSupported()) {
      return;
    }

    /*
     * The request is asynchronous, so the effect can be cleaned up before it
     * resolves — leaving a lock nobody holds a reference to. This flag is what
     * makes the late arrival release itself instead.
     */
    let isEffectActive = true;
    let currentSentinel: WakeLockSentinel | null = null;

    const requestLock = async (): Promise<void> => {
      try {
        const sentinel = await navigator.wakeLock.request('screen');

        if (!isEffectActive) {
          await sentinel.release();

          return;
        }

        currentSentinel = sentinel;
        setIsHoldingLock(true);

        sentinel.addEventListener('release', () => {
          setIsHoldingLock(false);
        });
      } catch {
        /*
         * Rejected because the tab is in the background, the battery saver is
         * on, or the browser simply declined. None of those are worth showing
         * anybody mid-session; the screen dims and the app carries on.
         */
        setIsHoldingLock(false);
      }
    };

    const handleVisibilityChanged = (): void => {
      if (document.visibilityState === 'visible') {
        void requestLock();
      }
    };

    void requestLock();
    document.addEventListener('visibilitychange', handleVisibilityChanged);

    return () => {
      isEffectActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChanged);
      setIsHoldingLock(false);

      void currentSentinel?.release();
    };
  }, [shouldKeepScreenAwake]);

  return { isSupported: isWakeLockSupported(), isHoldingLock };
}
