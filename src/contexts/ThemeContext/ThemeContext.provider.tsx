import { useCallback, useMemo, useState } from 'react';

import type { ThemeMode } from '@/types/theme.types';

import { setThemeCookie } from '@/utils/theme-cookie.util';

import type { ThemeProviderProps } from './ThemeContext.types';

import { ThemeContext } from './ThemeContext.context';

/**
 * ThemeProvider component that manages theme state and persistence
 * Uses cookies as primary storage for SSR compatibility, with localStorage sync
 * Wraps the application to provide theme context to all child components
 */
export const ThemeProvider = ({ children, defaultTheme = 'light', initialTheme }: ThemeProviderProps) => {
  // Use initialTheme from loader (cookie) if available, otherwise fall back to defaultTheme
  const [theme, setThemeState] = useState<ThemeMode>(() => initialTheme ?? defaultTheme);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    // Sync to cookie for SSR
    setThemeCookie(newTheme);
    // Also sync to localStorage for legacy support
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    globalThis.localStorage?.setItem('theme', JSON.stringify(newTheme));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({
      isDarkMode: theme === 'dark',
      setTheme,
      theme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
};
