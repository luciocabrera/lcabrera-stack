import { useState } from 'react';

import type { ThemeMode } from '#ui/types/theme.types';

import { setThemeCookie } from '#ui/utils/theme';

import type { ThemeProviderProps } from './ThemeContext.types';

import { ThemeContext } from './ThemeContext.context';

export const ThemeProvider = ({
  appId,
  children,
  defaultTheme = 'light',
  initialTheme,
}: ThemeProviderProps) => {
  // Use initialTheme from loader (cookie) if available, otherwise fall back to defaultTheme
  const [themeState, setThemeState] = useState<ThemeMode>(
    () => initialTheme ?? defaultTheme,
  );

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    // Sync to cookie for SSR
    setThemeCookie({ appId, theme: newTheme });
  };

  const toggleTheme = () => {
    setTheme(themeState === 'dark' ? 'light' : 'dark');
  };

  const value = {
    isDarkMode: themeState === 'dark',
    setTheme,
    theme: themeState,
    toggleTheme,
  };

  return <ThemeContext value={value}>{children}</ThemeContext>;
};
