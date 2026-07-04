import { GlobalSettingsProvider } from '@repo/ui/contexts/GlobalSettingsContext';
import { NotificationProvider } from '@repo/ui/contexts/NotificationContext';
import { ThemeProvider } from '@repo/ui/contexts/ThemeContext';

import type { AppProvidersProps } from './AppProviders.types';

/**
 * Composes the three app-wide providers (theme, global settings,
 * notifications) in the nesting order every consuming app needs — the
 * route supplies the SSR-derived initialTheme/globalSettings, this
 * component owns the provider order/composition itself.
 */
export const AppProviders = ({
  children,
  defaultTheme = 'light',
  globalSettings,
  initialTheme,
}: AppProvidersProps) => (
  <ThemeProvider defaultTheme={defaultTheme} initialTheme={initialTheme}>
    <GlobalSettingsProvider initialSettings={globalSettings}>
      <NotificationProvider>{children}</NotificationProvider>
    </GlobalSettingsProvider>
  </ThemeProvider>
);
