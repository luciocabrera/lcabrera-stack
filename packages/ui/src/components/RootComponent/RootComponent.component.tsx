import { AppProviders } from '@lcabrera/ui/components/AppProviders';
import { AppShell } from '@lcabrera/ui/components/AppShell';
import { AppConfigProvider } from '@lcabrera/ui/contexts/AppConfigContext';
import { useLoaderData } from 'react-router';

import type {
  RootComponentLoaderData,
  RootComponentProps,
} from './RootComponent.types';

/**
 * The whole root route of a consuming app: it reads the root loader's data,
 * composes the app-wide providers and renders the shell.
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
}: RootComponentProps) => {
  const rootData = useLoaderData<RootComponentLoaderData | undefined>();

  return (
    <AppConfigProvider
      getNavigationItems={getNavigationItems}
      isAuthEnabled={isAuthEnabled}
      logoutRoute={logoutRoute}
    >
      <AppProviders
        appId={appId}
        defaultTheme={defaultTheme}
        globalSettings={rootData?.globalSettings}
        initialTheme={rootData?.theme}
      >
        <AppShell />
      </AppProviders>
    </AppConfigProvider>
  );
};
