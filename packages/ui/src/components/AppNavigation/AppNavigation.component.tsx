import { SidePanel } from '@lcabrera/ui/components/SidePanel';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '@lcabrera/ui/contexts/GlobalSettingsContext/selectors';

import { NAV_DENSITY } from './AppNavigation.constants';
import { NavigationBody } from './NavigationBody/NavigationBody.component';
import { NavigationFooter } from './NavigationFooter/NavigationFooter.component';
import { NavigationHeader } from './NavigationHeader/NavigationHeader.component';

/**
 * Application navigation sidebar: an always-pinned SidePanel composed of a
 * header (brand + expand/collapse action), a body (app-supplied route links),
 * and a footer (theme toggle + session controls). The panel is permanent — it
 * collapses to an icon rail but is never dismissed, so every route keeps its
 * primary navigation reachable in one click.
 *
 * Zero props: it owns only the panel's own geometry, and every delegate reads
 * what it renders from `GlobalSettingsContext` and `AppConfigContext` itself.
 */
export const AppNavigation = () => {
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();

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
      <NavigationBody />
      <NavigationFooter />
    </SidePanel>
  );
};
