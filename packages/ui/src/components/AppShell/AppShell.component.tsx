import { AppNavigation } from '@lcabrera/ui/components/AppNavigation';
import { NotificationCenter } from '@lcabrera/ui/components/NotificationCenter';
import * as stylex from '@stylexjs/stylex';
import { Outlet } from 'react-router';

import type { AppShellProps } from './AppShell.types';

import { AppBackground } from '../AppBackground';
import { AppDotted } from '../AppDotted';
import { styles } from './AppShell.stylex';

export const AppShell = ({
  getNavigationItems,
  sessionActions,
}: AppShellProps) => {
  return (
    <AppBackground>
      <AppNavigation
        getNavigationItems={getNavigationItems}
        sessionActions={sessionActions}
      />
      <AppDotted>
        <main {...stylex.props(styles.main)}>
          <Outlet />
        </main>
      </AppDotted>
      <NotificationCenter />
    </AppBackground>
  );
};
