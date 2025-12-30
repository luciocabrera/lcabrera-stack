import * as stylex from '@stylexjs/stylex';
import { Outlet } from 'react-router';

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
      <div {...stylex.props(styles.outletWrapper)}>
        <Outlet />
      </div>
    </div>
  );
};

export const Root = () => {
  return (
    <ThemeProvider defaultTheme='light'>
      <RootContent />
    </ThemeProvider>
  );
};
