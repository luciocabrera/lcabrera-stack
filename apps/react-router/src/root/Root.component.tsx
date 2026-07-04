import { AppProviders } from '@repo/ui/components/AppProviders';
import { AppShell } from '@repo/ui/components/AppShell';
import { useLoaderData } from 'react-router';

import type { loader as rootLoader } from './root.loader';

export const Root = () => {
  const { globalSettings, theme } = useLoaderData<typeof rootLoader>();

  return (
    <AppProviders
      defaultTheme='light'
      globalSettings={globalSettings}
      initialTheme={theme}
    >
      <AppShell />
    </AppProviders>
  );
};
