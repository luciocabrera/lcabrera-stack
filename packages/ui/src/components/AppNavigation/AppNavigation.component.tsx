import { SidePanel } from '#ui/components/SidePanel';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { NAV_DENSITY } from './AppNavigation.constants';
import { NavigationBody } from './NavigationBody/NavigationBody.component';
import { NavigationFooter } from './NavigationFooter/NavigationFooter.component';
import { NavigationHeader } from './NavigationHeader/NavigationHeader.component';

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
