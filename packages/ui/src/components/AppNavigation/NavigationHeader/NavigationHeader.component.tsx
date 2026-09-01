import * as stylex from '@stylexjs/stylex';

import { MenuIcon } from '#ui/components/Icons';
import { useSetGlobalNavigationPreferences } from '#ui/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { NAV_DENSITY } from '../AppNavigation.constants';
import { styles } from '../AppNavigation.stylex';
import { NavigationHeaderActions } from '../NavigationHeaderActions';
import { getBrandIconSizeStyle, getHeaderDensityStyle } from '../utils';

export const NavigationHeader = () => {
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();

  const isExpanded = navigationCollapsedPreference !== 'collapsed';
  const isCollapsed = !isExpanded;

  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];
  const controlTooltipPlacement = isCollapsed ? 'right' : undefined;

  const brandIconSizeStyle = getBrandIconSizeStyle(density.brandIconBoxSize);
  const headerDensityStyle = getHeaderDensityStyle(navigationSizePreference);

  const handleToggleExpanded = () => {
    setGlobalNavigationPreferences({
      collapsed: isExpanded ? 'collapsed' : 'expanded',
    });
  };

  const headerActions = (
    <NavigationHeaderActions
      controlButtonSize={density.controlButtonSize}
      controlIconSize={density.controlIconSize}
      controlTooltipPlacement={controlTooltipPlacement}
      isCollapsed={isCollapsed}
      isExpanded={isExpanded}
      onToggleExpanded={handleToggleExpanded}
    />
  );

  return (
    <header {...stylex.props(styles.header, headerDensityStyle)}>
      <div {...stylex.props(styles.headerRow)}>
        <div
          {...stylex.props(styles.brand, isCollapsed && styles.brandCollapsed)}
        >
          <span {...stylex.props(styles.brandIcon, brandIconSizeStyle)}>
            <MenuIcon size={density.brandIconSize} />
          </span>
          <span
            {...stylex.props(
              styles.brandText,
              isCollapsed && styles.brandTextHidden,
            )}
          >
            Navigation
          </span>
        </div>
        {isExpanded && headerActions}
      </div>
      {!isExpanded && headerActions}
    </header>
  );
};
