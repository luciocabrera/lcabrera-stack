import type { NavigationSessionActions } from '@repo/ui/components/AppNavigation/AppNavigation.types';

/**
 * NavigationFooter component props
 */
export type NavigationFooterProps = {
  readonly isDarkMode: boolean;
  readonly onToggleTheme: () => void;
  readonly sessionActions?: NavigationSessionActions;
};
