import { AppProviders } from '#ui/components/AppProviders';
import { AppShell } from '#ui/components/AppShell';
import { AppConfigProvider } from '#ui/contexts/AppConfigContext';

import type { RootComponentProps } from './RootComponent.types';

/**
 * The whole root route of a consuming app: it publishes the app's configuration
 * and composes the providers and shell that read it.
 *
 * An app supplies only what genuinely depends on the app — its id, its default
 * theme, its route links and whether it has a session. Everything else was
 * boilerplate each app had to reproduce correctly for the shell to work at all,
 * the same reasoning that put `hydrateApp` and `createHandleRequest` behind the
 * client and server entries.
 */
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
