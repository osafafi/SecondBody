import { Outlet } from 'react-router-dom';

import styles from './AppShell.module.css';
import { BottomNavigation } from './BottomNavigation';

/**
 * The frame every screen renders inside: the background wash, the scrolling
 * content column, and the floating bottom navigation.
 *
 * The active session screen deliberately does NOT render inside this shell —
 * it takes over the whole display so there is nothing to tap by accident
 * mid-set. See the route table in `App.tsx`.
 */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <div className={styles.scrollableContent}>
        <Outlet />
      </div>

      <BottomNavigation />
    </div>
  );
}
