import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';
import { Outlet, useLoaderData } from 'react-router';

import { Button } from '@/components/Button';
import { NotificationCenter } from '@/components/NotificationCenter';
import { SidePanelToolbarExample } from '@/components/Toolbar/Toolbar.examples';
import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { darkTheme } from '@/design-system/themes/dark.stylex';
import { lightTheme } from '@/design-system/themes/light.stylex';
import { useTheme } from '@/hooks/useTheme.hook';

import { styles } from './Root.stylex';

import type { DbSanityPayload } from './Root.types';
import type { loader as rootLoader } from './root.loader';

const RootContent = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [dbSanityWarning, setDbSanityWarning] = useState<string | undefined>();

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    let isMounted = true;

    const runPreflight = async () => {
      try {
        const response = await fetch('/api/db-sanity');

        if (!response.ok) {
          if (isMounted) {
            setDbSanityWarning(
              `DB sanity endpoint returned status ${response.status}.`,
            );
          }
          return;
        }

        const payload = (await response.json()) as DbSanityPayload;
        if (!payload.isHealthy && isMounted) {
          const issues = payload.issues?.join(' | ') ?? 'Unknown DB issue.';
          setDbSanityWarning(issues);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to reach /api/db-sanity.';
        setDbSanityWarning(message);
      }
    };

    void runPreflight();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div {...stylex.props(styles.base, isDarkMode ? darkTheme : lightTheme)}>
      <SidePanelToolbarExample />
      {dbSanityWarning ? (
        <div {...stylex.props(styles.devWarningBanner)}>
          Dev DB warning: {dbSanityWarning} Run `vp run seed` in `api-server`.
        </div>
      ) : undefined}
      <Button color='ghost' onClick={toggleTheme}>
        {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </Button>
      <NotificationCenter />
      <main {...stylex.props(styles.outletWrapper)}>
        <Outlet />
      </main>
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
