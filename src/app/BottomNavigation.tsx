import { CalendarDays, Dumbbell, Settings2, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { GradientSurface } from '@/components/GradientSurface/GradientSurface';

import { APP_ROUTE_PATHS } from './appRoutes';
import styles from './BottomNavigation.module.css';

type BottomNavigationItem = {
  routePath: string;
  label: string;
  icon: typeof Dumbbell;
};

/**
 * Four items, not five.
 *
 * The exercise library is deliberately absent — it is reached from the Today
 * screen and from inside a session, which is where you actually want it. Four
 * targets across a phone is comfortable for a thumb; five starts to get fiddly.
 */
const BOTTOM_NAVIGATION_ITEMS: readonly BottomNavigationItem[] = [
  { routePath: APP_ROUTE_PATHS.today, label: 'Today', icon: Dumbbell },
  { routePath: APP_ROUTE_PATHS.schedule, label: 'Schedule', icon: CalendarDays },
  { routePath: APP_ROUTE_PATHS.progress, label: 'Progress', icon: TrendingUp },
  { routePath: APP_ROUTE_PATHS.settings, label: 'Settings', icon: Settings2 },
];

export function BottomNavigation() {
  return (
    <GradientSurface
      as="nav"
      variant="glass"
      radius="xlarge"
      className={styles.navigation}
      aria-label="Main navigation"
    >
      {BOTTOM_NAVIGATION_ITEMS.map(({ routePath, label, icon: NavigationIcon }) => (
        <NavLink
          key={routePath}
          to={routePath}
          // `end` keeps the Today tab from matching every route, since its path is "/".
          end={routePath === APP_ROUTE_PATHS.today}
          className={({ isActive }) =>
            [styles.navigationItem, isActive ? styles.isActive : null].filter(Boolean).join(' ')
          }
        >
          <NavigationIcon className={styles.icon} size={22} strokeWidth={1.75} aria-hidden />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </GradientSurface>
  );
}
