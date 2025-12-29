import type { ReactNode } from 'react';

/**
 * Props for ThemeProvider component
 */
export type ThemeProviderProps = {
  readonly children: ReactNode;
  readonly defaultTheme?: 'dark' | 'light';
};
