import type { NavigationSessionActions } from '@/components/AppNavigation/AppNavigation.types';

/**
 * NavigationFooter component props
 */
export type NavigationFooterProps = {
  readonly isDarkMode: boolean;
  readonly onToggleTheme: () => void;
  readonly sessionActions?: NavigationSessionActions;
};
