import * as stylex from '@stylexjs/stylex';
import { Outlet, useLoaderData } from 'react-router';

import type { ThemeMode } from '@/types/theme.types';

import { Button } from '@/components/Button';
import { SidePanelToolbarExample } from '@/components/Toolbar/Toolbar.examples';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { darkTheme } from '@/design-system/themes/dark.stylex';
import { lightTheme } from '@/design-system/themes/light.stylex';
import { useTheme } from '@/hooks/useTheme.hook';

import { styles } from './Root.stylex';

const RootContent = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div {...stylex.props(styles.base, isDarkMode ? darkTheme : lightTheme)}>
      <SidePanelToolbarExample />
      <Button color='ghost' onClick={toggleTheme}>
        {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </Button>
      <main {...stylex.props(styles.outletWrapper)}>
        <Outlet />
      </main>
    </div>
  );
};

export const Root = () => {
  const { theme } = useLoaderData<{ theme?: ThemeMode }>();

  return (
    <ThemeProvider defaultTheme='light' initialTheme={theme}>
      <RootContent />
    </ThemeProvider>
  );
};
