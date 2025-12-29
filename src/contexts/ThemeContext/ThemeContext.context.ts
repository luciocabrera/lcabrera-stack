import { createContext } from 'react';

import type { ThemeContextValue } from '@/types/theme.types';

/**
 * Theme context for managing application theme state
 * Use the useTheme hook to access this context instead of useContext
 */
export const ThemeContext = createContext<null | ThemeContextValue>(null);

ThemeContext.displayName = 'ThemeContext';
