import { GlobalSettingsProvider } from '@lcabrera/ui/contexts/GlobalSettingsContext';
import { NotificationProvider } from '@lcabrera/ui/contexts/NotificationContext';
import { ThemeProvider } from '@lcabrera/ui/contexts/ThemeContext';
import { useLoaderData } from 'react-router';

import type {
  AppProvidersLoaderData,
  AppProvidersProps,
} from './AppProviders.types';

/**
 * Composes the three app-wide providers (theme, global settings,
 * notifications) in the nesting order every consuming app needs, and reads the
 * SSR-derived theme / global settings it seeds them with itself.
 *
 * Reading the loader here rather than taking the values as props is the same
 * call PATTERNS.md §"Thin Shell + Self-Connected Delegates" makes everywhere
 * else: this is the only component that uses them, so a parent that read them
 * would exist purely to name them again. `useLoaderData` returns undefined for
 * a route with no loader, so an app without one degrades to `defaultTheme`.
 */
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
