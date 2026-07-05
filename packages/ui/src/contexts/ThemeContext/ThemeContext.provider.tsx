import { useState } from 'react';

import type { ThemeMode } from '@repo/ui/types/theme.types';

import { setThemeCookie } from '@repo/ui/utils/theme';

import type { ThemeProviderProps } from './ThemeContext.types';

import { ThemeContext } from './ThemeContext.context';

/**
 * ThemeProvider component that manages theme state and persistence
 * Uses cookies as primary storage for SSR compatibility, with localStorage sync
 * Wraps the application to provide theme context to all child components
 */
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
    setThemeCookie(newTheme, appId);
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
