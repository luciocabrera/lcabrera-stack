import type { ThemeContextValue } from '@lcabrera/ui/types/theme.types';

import { createContext } from 'react';

/**
 * Theme context for managing application theme state
 * Use the useTheme hook to access this context instead of useContext
 */
export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

ThemeContext.displayName = 'ThemeContext';
