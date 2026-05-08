/**
 * Available sidebar width modes.
 */
export type AppNavigationMode = 'compact' | 'full';

/**
 * Props for the application navigation sidebar.
 */
export type AppNavigationProps = {
  readonly defaultIsPinned?: boolean;
  readonly defaultMode?: AppNavigationMode;
  readonly isDarkMode: boolean;
  readonly onToggleTheme: () => void;
};
