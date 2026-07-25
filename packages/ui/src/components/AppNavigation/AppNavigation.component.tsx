import { SidePanel } from '@lcabrera/ui/components/SidePanel';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '@lcabrera/ui/contexts/GlobalSettingsContext/selectors';
import { useTheme } from '@lcabrera/ui/hooks/useTheme.hook';

import type { AppNavigationProps } from './AppNavigation.types';

import { NAV_DENSITY } from './AppNavigation.constants';
import { NavigationBody } from './NavigationBody/NavigationBody.component';
import { NavigationFooter } from './NavigationFooter/NavigationFooter.component';
import { NavigationHeader } from './NavigationHeader/NavigationHeader.component';

/**
 * Application navigation sidebar: an always-pinned SidePanel composed of a
 * header (brand + expand/collapse action), a body (app-supplied route links),
 * and a footer (theme toggle). The panel is permanent — it collapses to an
 * icon rail but is never dismissed, so every route keeps its primary
 * navigation reachable in one click.
 */
export const AppNavigation = ({
  getNavigationItems,
  sessionActions,
}: AppNavigationProps) => {
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();
  const { isDarkMode, toggleTheme } = useTheme();

  const isExpanded = navigationCollapsedPreference !== 'collapsed';
  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];

  return (
    <SidePanel
      aria-label='Main navigation'
      isOpen
      isPinned
      position='left'
      size={isExpanded ? density.expandedSize : density.collapsedSize}
    >
      <NavigationHeader />
      <NavigationBody getNavigationItems={getNavigationItems} />
      <NavigationFooter
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        sessionActions={sessionActions}
      />
    </SidePanel>
  );
};
