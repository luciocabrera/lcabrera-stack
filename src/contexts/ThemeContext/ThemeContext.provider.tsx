import { useMemo } from 'react';

import type { ThemeMode } from '@/types/theme.types';

import { useLocalStorage } from '@/hooks/useLocalStorage.hook';

import { ThemeContext } from './ThemeContext.context';
import type { ThemeProviderProps } from './ThemeContext.types';

/**
 * ThemeProvider component that manages theme state and persistence
 * Wraps the application to provide theme context to all child components
 */
export const ThemeProvider = ({ children, defaultTheme = 'light' }: ThemeProviderProps) => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('theme', defaultTheme);

  const value = useMemo(
    () => ({
      isDarkMode: theme === 'dark',
      setTheme,
      theme,
      toggleTheme: () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
      },
    }),
    [theme, setTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
};
