import { AppProviders, AppShell } from '@lcabrera/ui';
import { useLoaderData } from 'react-router';

import { APP_ID } from '@/constants/app.constants';

import type { loader as rootLoader } from './root.loader';

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
