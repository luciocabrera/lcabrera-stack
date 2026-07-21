import { ThemeContext } from '@lcabrera/ui/contexts/ThemeContext';
import { use } from 'react';

/**
 * Custom hook to access theme context
 * Uses React 19's use() API instead of useContext
 * @throws Error if used outside of ThemeProvider
 * @returns ThemeContextValue with theme state and setters
 */
export const useTheme = () => {
  const context = use(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
