import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { MenuIcon } from '@/components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
} from '@/components/SidePanel';
import { Toolbar } from '@/components/Toolbar';
import { useSetGlobalNavigationPreferences } from '@/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationPinnedPreference,
  useGetGlobalNavigationSizePreference,
} from '@/contexts/GlobalSettingsContext/selectors';

import type { AppNavigationProps } from './AppNavigation.types';

import { NAV_DENSITY } from './AppNavigation.constants';
import { styles } from './AppNavigation.stylex';
import { NavigationHeaderActions } from './NavigationHeaderActions';
import { NavigationLauncher } from './NavigationLauncher';
import {
  getBodyDensityStyle,
  getBrandIconSizeStyle,
  getHeaderDensityStyle,
  getNavigationItems,
  isNavigationPinned,
  resolveThemeLabel,
} from './utils';

/**
 * Pinned or off-canvas application navigation sidebar.
 */
export const AppNavigation = ({
  defaultIsPinned = true,
  isDarkMode,
  onToggleTheme,
}: AppNavigationProps) => {
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationPinnedPreference = useGetGlobalNavigationPinnedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();

  const [isOpen, setIsOpen] = useState(() => {
    const isPinnedInitially = isNavigationPinned({
      defaultIsPinned,
      navigationPinnedPreference,
    });

    return !isPinnedInitially;
  });

  const isExpanded = navigationCollapsedPreference !== 'collapsed';
  const isPinned = isNavigationPinned({
    defaultIsPinned,
    navigationPinnedPreference,
  });
  const isCollapsed = !isExpanded;

  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];
  const themeLabel = resolveThemeLabel(isDarkMode);
  const controlTooltipPlacement = isCollapsed ? 'right' : undefined;
  const themeTooltipContent = isCollapsed ? themeLabel : undefined;

  // Brand icon box matches button height per density for visual consistency
  const brandIconSizeStyle = getBrandIconSizeStyle(density.brandIconBoxSize);
  const headerDensityStyle = getHeaderDensityStyle(navigationSizePreference);
  const bodyDensityStyle = getBodyDensityStyle(navigationSizePreference);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

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
      onClose={handleClose}
      onToggleExpanded={handleToggleExpanded}
      onTogglePinned={handleTogglePinned}
    />
  );

  const panel = (
    <SidePanel
      aria-label='Main navigation'
      isOpen={isOpen}
      isPinned={isPinned}
      onClose={handleClose}
      position='left'
      shouldShowOverlay
      size={isExpanded ? density.expandedSize : density.collapsedSize}
    >
      <header {...stylex.props(styles.header, headerDensityStyle)}>
        <div {...stylex.props(styles.headerRow)}>
          <div
            {...stylex.props(
              styles.brand,
              isCollapsed && styles.brandCollapsed,
            )}
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
          {isExpanded ? headerActions : undefined}
        </div>
        {isExpanded ? undefined : headerActions}
      </header>
      <SidePanelBody>
        <div {...stylex.props(styles.bodyContent, bodyDensityStyle)}>
          <Toolbar
            aria-label='Main navigation links'
            data-testid='main-navigation'
            isCompact={!isExpanded}
            items={getNavigationItems(density.navIconSize)}
            orientation='vertical'
            size={density.controlButtonSize}
          />
        </div>
      </SidePanelBody>
      <SidePanelFooter>
        <div {...stylex.props(styles.footer)}>
          <Button
            aria-label={themeLabel}
            color='ghost'
            icon={isDarkMode ? '☀️' : '🌙'}
            isIconOnly={!isExpanded}
            onClick={onToggleTheme}
            size={density.controlButtonSize}
            tooltipContent={themeTooltipContent}
            tooltipPlacement='right'
            width='full'
          >
            {themeLabel}
          </Button>
        </div>
      </SidePanelFooter>
    </SidePanel>
  );

  if (isPinned) {
    return panel;
  }

  return (
    <>
      <NavigationLauncher onOpen={handleOpen} />
      {panel}
    </>
  );
};
