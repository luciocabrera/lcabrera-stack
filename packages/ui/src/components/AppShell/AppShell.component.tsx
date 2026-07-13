import { AppNavigation } from '@repo/ui/components/AppNavigation';
import { NotificationCenter } from '@repo/ui/components/NotificationCenter';
import { Outlet } from 'react-router';

import type { AppShellProps } from './AppShell.types';

import { AppBackground } from '../AppBackground';
import { AppDotted } from '../AppDotted';

export const AppShell = ({ getNavigationItems }: AppShellProps) => {
  return (
    <AppBackground>
      <AppNavigation getNavigationItems={getNavigationItems} />
      <AppDotted>
        <Outlet />
      </AppDotted>
      <NotificationCenter />
    </AppBackground>
  );
};
