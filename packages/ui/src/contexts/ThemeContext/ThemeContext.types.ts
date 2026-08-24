import type { ReactNode } from 'react';

import type { ThemeMode } from '#ui/types/theme.types';

export type ThemeProviderProps = {
  readonly appId?: string;
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeMode;
  readonly initialTheme?: ThemeMode;
};
