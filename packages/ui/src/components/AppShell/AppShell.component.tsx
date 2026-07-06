import { AppNavigation } from '@repo/ui/components/AppNavigation';
import { NotificationCenter } from '@repo/ui/components/NotificationCenter';
import { darkTheme } from '@repo/ui/design-system/themes/dark.stylex';
import { lightTheme } from '@repo/ui/design-system/themes/light.stylex';
import { useTheme } from '@repo/ui/hooks/useTheme.hook';
import * as stylex from '@stylexjs/stylex';
import { Outlet } from 'react-router';

import type { AppShellProps } from './AppShell.types';

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
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div {...stylex.props(styles.base, isDarkMode ? darkTheme : lightTheme)}>
      <div {...stylex.props(styles.appShell, styles.overlayParent)}>
        <div
          {...stylex.props(styles.overlay, styles.radial, styles.appOverlay)}
        ></div>
        <AppNavigation
          getNavigationItems={getNavigationItems}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
        <main {...stylex.props(styles.outletWrapper)}>
          <Outlet />
        </main>
      </div>
      <NotificationCenter />
    </div>
  );
};
