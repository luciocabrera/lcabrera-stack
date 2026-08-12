import * as stylex from '@stylexjs/stylex';
import { Outlet } from 'react-router';

import { AppNavigation } from '#ui/components/AppNavigation';
import { NotificationCenter } from '#ui/components/NotificationCenter';

import { AppBackground } from '../AppBackground';
import { AppDotted } from '../AppDotted';
import { styles } from './AppShell.stylex';

/**
 * The app frame rendered inside `AppProviders`: themed background, navigation,
 * the routed `<Outlet />` inside the `<main>` landmark, and the notification
 * centre. Pure composition — everything app-specific reaches the delegate that
 * renders it through `AppConfigContext`, so nothing is threaded through here.
 */
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
