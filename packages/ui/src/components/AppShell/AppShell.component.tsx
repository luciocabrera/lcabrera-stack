import { AppNavigation } from '@repo/ui/components/AppNavigation';
import { NotificationCenter } from '@repo/ui/components/NotificationCenter';
import * as stylex from '@stylexjs/stylex';
import { Outlet } from 'react-router';

import type { AppShellProps } from './AppShell.types';

import { AppBackground } from '../AppBackground';
import { styles } from './AppShell.stylex';

/**
 * The app frame every consuming app renders inside AppProviders: themed
 * background, AppNavigation, a routed <Outlet />, and NotificationCenter.
 * Theme comes from the ThemeProvider above it (via AppProviders), routed
 * content comes from React Router's route tree; `getNavigationItems` is the
 * one thing each consuming app must supply itself (see AppNavigation's own
 * prop doc).
 */
export const AppShell = ({ getNavigationItems }: AppShellProps) => {
  return (
    <AppBackground>
      <AppNavigation getNavigationItems={getNavigationItems} />
      <main {...stylex.props(styles.outletWrapper)}>
        <Outlet />
      </main>
      <NotificationCenter />
    </AppBackground>
  );
};
