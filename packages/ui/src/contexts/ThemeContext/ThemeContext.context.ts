import { createContext } from 'react';

import type { ThemeContextValue } from '#ui/types/theme.types';

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

ThemeContext.displayName = 'ThemeContext';
