import * as stylex from '@stylexjs/stylex';

import { Navbar } from '#ui/components/Navbar';
import { SidePanelBody } from '#ui/components/SidePanel';
import { useGetAppNavigationItems } from '#ui/contexts/AppConfigContext/selectors';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { NAV_DENSITY } from '../AppNavigation.constants';
import { styles } from '../AppNavigation.stylex';
import { getBodyDensityStyle } from '../utils';

/**
 * Body of the navigation sidebar: the vertical toolbar of app-supplied route
 * links, compacted to icons when the navigation is collapsed and sized by
 * the global density preference.
 */
export const NavigationBody = () => {
  const getNavigationItems = useGetAppNavigationItems();
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();

  const isExpanded = navigationCollapsedPreference !== 'collapsed';

  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];
  const bodyDensityStyle = getBodyDensityStyle(navigationSizePreference);

  return (
    <SidePanelBody>
      <div {...stylex.props(styles.bodyContent, bodyDensityStyle)}>
        <Navbar
          aria-label='Main navigation links'
          data-testid='main-navigation'
          isCompact={!isExpanded}
          items={getNavigationItems(density.navIconSize)}
          orientation='vertical'
          size={density.controlButtonSize}
        />
      </div>
    </SidePanelBody>
  );
};
