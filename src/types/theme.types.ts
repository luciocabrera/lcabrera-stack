/**
 * Theme mode type
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Theme context value type
 */
export type ThemeContextValue = {
  readonly isDarkMode: boolean;
  readonly theme: ThemeMode;
  readonly toggleTheme: () => void;
  readonly setTheme: (theme: ThemeMode) => void;
};
