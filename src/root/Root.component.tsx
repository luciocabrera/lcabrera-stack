import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { Outlet } from 'react-router';

import { Button } from '@/components/Button';
import { SidePanelToolbarExample } from '@/components/Toolbar/Toolbar.examples';
import { darkTheme } from '@/design-system/themes/dark.stylex';
import { lightTheme } from '@/design-system/themes/light.stylex';

import { styles } from './Root.stylex';

export const Root = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div {...stylex.props(styles.base, isDarkMode ? darkTheme : lightTheme)}>
      {/* <SidePanelToolbarExample /> */}
      <Button color='ghost' onClick={handleToggleTheme}>
        {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </Button>
      <Outlet />
    </div>
  );
};
