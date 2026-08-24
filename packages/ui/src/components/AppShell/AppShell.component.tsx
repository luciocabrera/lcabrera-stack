import * as stylex from '@stylexjs/stylex';
import { Outlet } from 'react-router';

import { AppNavigation } from '#ui/components/AppNavigation';
import { NotificationCenter } from '#ui/components/NotificationCenter';

import { AppBackground } from '../AppBackground';
import { AppDotted } from '../AppDotted';
import { styles } from './AppShell.stylex';

export const AppShell = () => (
  <AppBackground>
    <AppNavigation />
    <AppDotted>
      <main {...stylex.props(styles.main)}>
        <Outlet />
      </main>
    </AppDotted>
    <NotificationCenter />
  </AppBackground>
);
