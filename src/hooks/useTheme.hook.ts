import { use } from 'react';

import type { ThemeContextValue } from '@/types/theme.types';

import { ThemeContext } from '@/contexts/ThemeContext';

/**
 * Custom hook to access theme context
 * Uses React 19's use() API instead of useContext
 * @throws Error if used outside of ThemeProvider
 * @returns ThemeContextValue with theme state and setters
 */
export const useTheme = (): ThemeContextValue => {
  const context = use(ThemeContext);

  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
