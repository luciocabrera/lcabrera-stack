import { useCallback, useState } from 'react';

import type { ThemeMode } from '@/types/theme.types';

import { setThemeCookie } from '@/utils/theme';

import type { ThemeProviderProps } from './ThemeContext.types.ts';

import { ThemeContext } from './ThemeContext.context.ts';

/**
 * ThemeProvider component that manages theme state and persistence
 * Uses cookies as primary storage for SSR compatibility, with localStorage sync
 * Wraps the application to provide theme context to all child components
 */
export const ThemeProvider = ({
  children,
  defaultTheme = 'light',
  initialTheme,
}: ThemeProviderProps) => {
  // Use initialTheme from loader (cookie) if available, otherwise fall back to defaultTheme
  const [themeState, setThemeState] = useState<ThemeMode>(
    () => initialTheme ?? defaultTheme,
  );

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    // Sync to cookie for SSR
    setThemeCookie(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(themeState === 'dark' ? 'light' : 'dark');
  }, [themeState, setTheme]);

  const value = {
    isDarkMode: themeState === 'dark',
    setTheme,
    theme: themeState,
    toggleTheme,
  };

  return <ThemeContext value={value}>{children}</ThemeContext>;
};
