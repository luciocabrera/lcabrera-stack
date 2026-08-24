export type ThemeContextValue = {
  readonly isDarkMode: boolean;
  readonly setTheme: (theme: ThemeMode) => void;
  readonly theme: ThemeMode;
  readonly toggleTheme: () => void;
};

export type ThemeMode = 'dark' | 'light';
