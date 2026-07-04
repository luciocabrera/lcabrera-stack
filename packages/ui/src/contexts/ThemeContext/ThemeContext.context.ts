import { createContext } from 'react';

import type { ThemeContextValue } from '@repo/ui/types/theme.types';

/**
 * Theme context for managing application theme state
 * Use the useTheme hook to access this context instead of useContext
 */
export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

ThemeContext.displayName = 'ThemeContext';
