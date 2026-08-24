import { AppProviders } from '#ui/components/AppProviders';
import { AppShell } from '#ui/components/AppShell';
import { AppConfigProvider } from '#ui/contexts/AppConfigContext';

import type { RootComponentProps } from './RootComponent.types';

export const RootComponent = ({
  appId,
  defaultTheme = 'light',
  getNavigationItems,
  isAuthEnabled = false,
  logoutRoute,
}: RootComponentProps) => (
  <AppConfigProvider
    getNavigationItems={getNavigationItems}
    isAuthEnabled={isAuthEnabled}
    logoutRoute={logoutRoute}
  >
    <AppProviders appId={appId} defaultTheme={defaultTheme}>
      <AppShell />
    </AppProviders>
  </AppConfigProvider>
);
