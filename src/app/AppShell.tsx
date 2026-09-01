import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useStoredColorPaletteSync } from '@/hooks/useStoredColorPaletteSync';

import styles from './AppShell.module.css';
import { BottomNavigation } from './BottomNavigation';
import { useAuthentication } from './useAuthentication';

/**
 * The frame every screen renders inside: the background wash, the scrolling
 * content column, and the floating bottom navigation.
 *
 * The active session screen deliberately does NOT render inside this shell —
 * it takes over the whole display so there is nothing to tap by accident
 * mid-set. See the route table in `App.tsx`.
 *
 * It is also where the stored colour palette is brought in. The shell is the
 * first thing that renders with a signed-in user behind it, and doing it here
 * means one read on launch rather than one per screen that happens to care.
 */
export function AppShell() {
  const { signedInUser } = useAuthentication();

  useStoredColorPaletteSync(signedInUser?.userId ?? null);
  useScrollToTopOnNavigation();

  return (
    <div className={styles.shell}>
      <div className={styles.scrollableContent}>
        <Outlet />
      </div>

      <BottomNavigation />
    </div>
  );
}

/**
 * Every navigation starts at the top of the new screen.
 *
 * The browser keeps the scroll position across a client-side navigation, which
 * was harmless while the only way to change screen was the bottom navigation —
 * four short screens, and you were usually at the top of one anyway. It stopped
 * being harmless the moment there were screens you reach by tapping something
 * partway down a long list: opening an exercise from the bottom of the library
 * landed you in the middle of its cues, looking at a paragraph about what goes
 * wrong with no idea what movement it belonged to.
 *
 * Here rather than on each screen, because it is a property of the shell: any
 * screen added to it gets the behaviour without having to remember to.
 *
 * `useLayoutEffect` is deliberately not used. This must not fight a browser
 * restoring position on a back navigation before it has finished doing it, and
 * the paint it costs is a screen that appears at the top rather than one that
 * visibly jumps there.
 */
function useScrollToTopOnNavigation() {
  const { pathname } = useLocation();

  useEffect(() => {
    /* `instant`, not `smooth`. A new screen has not moved; it has replaced. */
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
}
