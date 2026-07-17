import { AppNavigation } from '@repo/ui/components/AppNavigation';
import { NotificationCenter } from '@repo/ui/components/NotificationCenter';
import * as stylex from '@stylexjs/stylex';
import { Outlet } from 'react-router';

import type { AppShellProps } from './AppShell.types';

import { AppBackground } from '../AppBackground';
import { AppDotted } from '../AppDotted';
import { styles } from './AppShell.stylex';

export const AppShell = ({ getNavigationItems }: AppShellProps) => {
  return (
    <AppBackground>
      <AppNavigation getNavigationItems={getNavigationItems} />
      <AppDotted>
        <main {...stylex.props(styles.main)}>
          <Outlet />
        </main>
      </AppDotted>
      <NotificationCenter />
    </AppBackground>
  );
};
