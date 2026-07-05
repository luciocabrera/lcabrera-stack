import { AppProviders } from '@repo/ui/components/AppProviders';
import { AppShell } from '@repo/ui/components/AppShell';
import { useLoaderData } from 'react-router';

import type { loader as rootLoader } from './root.loader';

import { APP_ID } from '@/constants/app.constants';
import { getNavigationItems } from './getNavigationItems.util';

export const Root = () => {
  const { globalSettings, theme } = useLoaderData<typeof rootLoader>();

  return (
    <AppProviders
      appId={APP_ID}
      defaultTheme='light'
      globalSettings={globalSettings}
      initialTheme={theme}
    >
      <AppShell getNavigationItems={getNavigationItems} />
    </AppProviders>
  );
};
