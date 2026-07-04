import type { ReactNode } from 'react';

import type { ThemeMode } from '@repo/ui/types/theme.types';

/**
 * Props for ThemeProvider component
 */
export type ThemeProviderProps = {
  readonly children: ReactNode;
  /** Default theme if no cookie/localStorage value exists */
  readonly defaultTheme?: ThemeMode;
  /** Initial theme from SSR loader (cookie value) - takes priority over defaultTheme */
  readonly initialTheme?: ThemeMode;
};
