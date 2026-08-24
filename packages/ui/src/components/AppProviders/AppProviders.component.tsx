import { useLoaderData } from 'react-router';

import { GlobalSettingsProvider } from '#ui/contexts/GlobalSettingsContext';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { ThemeProvider } from '#ui/contexts/ThemeContext';

import type {
  AppProvidersLoaderData,
  AppProvidersProps,
} from './AppProviders.types';

export const AppProviders = ({
  appId,
  children,
  defaultTheme = 'light',
}: AppProvidersProps) => {
  const rootData = useLoaderData<AppProvidersLoaderData | undefined>();

  return (
    <ThemeProvider
      appId={appId}
      defaultTheme={defaultTheme}
      initialTheme={rootData?.theme}
    >
      <GlobalSettingsProvider
        appId={appId}
        initialSettings={rootData?.globalSettings}
      >
        <NotificationProvider>{children}</NotificationProvider>
      </GlobalSettingsProvider>
    </ThemeProvider>
  );
};
