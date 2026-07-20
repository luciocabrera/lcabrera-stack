import { AppProviders, AppShell } from '@repo/ui';
import { useLoaderData } from 'react-router';

import { APP_ID } from '@/constants/app.constants';

import type { LogoutControlProps } from './LogoutControl.types';
import type { loader as rootLoader } from './root.loader';

import { getNavigationItems } from './getNavigationItems.util';
import { LogoutControl } from './LogoutControl.component';

/**
 * Renders the logout control for `AppShell`'s `sessionActions` slot. Defined at
 * module scope (not inline in `Root`) so it's a stable reference and not a
 * component nested inside another — the arg shape is exactly `LogoutControlProps`.
 */
const renderSessionActions = ({ isCollapsed }: LogoutControlProps) => (
  <LogoutControl isCollapsed={isCollapsed} />
);

export const Root = () => {
  const { globalSettings, theme } = useLoaderData<typeof rootLoader>();

  return (
    <AppProviders
      appId={APP_ID}
      defaultTheme='light'
      globalSettings={globalSettings}
      initialTheme={theme}
    >
      <AppShell
        getNavigationItems={getNavigationItems}
        sessionActions={renderSessionActions}
      />
    </AppProviders>
  );
};
