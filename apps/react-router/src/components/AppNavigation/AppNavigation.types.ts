/**
 * Props for the application navigation sidebar.
 */
export type AppNavigationProps = {
  readonly defaultIsPinned?: boolean;
  readonly isDarkMode: boolean;
  readonly onToggleTheme: () => void;
};
