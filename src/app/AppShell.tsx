import { Outlet } from 'react-router-dom';

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

  return (
    <div className={styles.shell}>
      <div className={styles.scrollableContent}>
        <Outlet />
      </div>

      <BottomNavigation />
    </div>
  );
}
