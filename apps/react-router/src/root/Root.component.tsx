import * as stylex from '@stylexjs/stylex';
import { Outlet, useLoaderData } from 'react-router';

import { AppNavigation } from '@/components/AppNavigation';
import { NotificationCenter } from '@/components/NotificationCenter';
import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { darkTheme } from '@/design-system/themes/dark.stylex';
import { lightTheme } from '@/design-system/themes/light.stylex';
import { useTheme } from '@/hooks/useTheme.hook';

import { styles } from './Root.stylex';

import type { loader as rootLoader } from './root.loader';

const RootContent = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div {...stylex.props(styles.base, isDarkMode ? darkTheme : lightTheme)}>
      <div {...stylex.props(styles.appShell)}>
        <AppNavigation isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
        <main {...stylex.props(styles.outletWrapper)}>
          <Outlet />
        </main>
      </div>
      <NotificationCenter />
    </div>
  );
};

export const Root = () => {
  const { globalSettings, theme } = useLoaderData<typeof rootLoader>();

  return (
    <ThemeProvider defaultTheme='light' initialTheme={theme}>
      <GlobalSettingsProvider initialSettings={globalSettings}>
        <NotificationProvider>
          <RootContent />
        </NotificationProvider>
      </GlobalSettingsProvider>
    </ThemeProvider>
  );
};
