import { AppProviders, AppShell } from '@repo/ui';
import { useLoaderData } from 'react-router';

import { APP_ID } from '@/constants/app.constants';

import type { LogoutControlProps } from './LogoutControl.types';
import type { loader as rootLoader } from './root.loader';

import { getNavigationItems } from './getNavigationItems.util';
import { LogoutControl } from './LogoutControl.component';

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
        sessionActions={({ isCollapsed }: LogoutControlProps) => (
          <LogoutControl isCollapsed={isCollapsed} />
        )}
      />
    </AppProviders>
  );
};
