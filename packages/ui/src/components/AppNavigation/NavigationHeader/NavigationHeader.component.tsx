import { MenuIcon } from '@repo/ui/components/Icons';
import { useSetGlobalNavigationPreferences } from '@repo/ui/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '@repo/ui/contexts/GlobalSettingsContext/selectors';
import * as stylex from '@stylexjs/stylex';

import type { NavigationHeaderProps } from './NavigationHeader.types';

import { NAV_DENSITY } from '../AppNavigation.constants';
import { styles } from '../AppNavigation.stylex';
import { NavigationHeaderActions } from '../NavigationHeaderActions';
import { getBrandIconSizeStyle, getHeaderDensityStyle } from '../utils';

/**
 * Header of the navigation sidebar: brand icon + title plus the
 * expand/collapse, pin, and close actions. The actions sit inline with the
 * brand when expanded and drop below it when collapsed. Owns the
 * collapse/pin preference writes; closing is delegated to the parent, which
 * owns the off-canvas open state.
 */
export const NavigationHeader = ({
  isPinned,
  onClose,
}: NavigationHeaderProps) => {
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();

  const isExpanded = navigationCollapsedPreference !== 'collapsed';
  const isCollapsed = !isExpanded;

  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];
  const controlTooltipPlacement = isCollapsed ? 'right' : undefined;

  // Brand icon box matches button height per density for visual consistency
  const brandIconSizeStyle = getBrandIconSizeStyle(density.brandIconBoxSize);
  const headerDensityStyle = getHeaderDensityStyle(navigationSizePreference);

  const handleToggleExpanded = () => {
    setGlobalNavigationPreferences({
      collapsed: isExpanded ? 'collapsed' : 'expanded',
    });
  };

  const handleTogglePinned = () => {
    setGlobalNavigationPreferences({
      pinned: isPinned ? 'unpinned' : 'pinned',
    });
  };

  const headerActions = (
    <NavigationHeaderActions
      controlButtonSize={density.controlButtonSize}
      controlIconSize={density.controlIconSize}
      controlTooltipPlacement={controlTooltipPlacement}
      isCollapsed={isCollapsed}
      isExpanded={isExpanded}
      isPinned={isPinned}
      onClose={onClose}
      onToggleExpanded={handleToggleExpanded}
      onTogglePinned={handleTogglePinned}
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
