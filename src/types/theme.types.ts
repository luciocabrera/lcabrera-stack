/**
 * Theme context value type
 */
export type ThemeContextValue = {
  readonly isDarkMode: boolean;
  readonly setTheme: (theme: ThemeMode) => void;
  readonly theme: ThemeMode;
  readonly toggleTheme: () => void;
};

/**
 * Theme mode type
 */
export type ThemeMode = 'dark' | 'light';
