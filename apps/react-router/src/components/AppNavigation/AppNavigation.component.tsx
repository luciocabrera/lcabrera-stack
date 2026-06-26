import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

import type { GlobalNavigationSizePreference } from '@/types/globalSettings.types';

import { Button } from '@/components/Button';
import {
  MaximizeIcon,
  MenuCloseIcon,
  MenuIcon,
  MinimizeIcon,
  PinIcon,
  PinOffIcon,
} from '@/components/Icons';
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
import { ICON_SIZE_LG } from '@/design-system/constants';

import type {
  AppNavigationProps,
  ResolvePinnedStateArgs,
} from './AppNavigation.types';

import { getNavigationItems, NAV_DENSITY } from './AppNavigation.constants';
import { styles } from './AppNavigation.stylex';

const isNavigationPinned = ({
  defaultIsPinned,
  navigationPinnedPreference,
}: ResolvePinnedStateArgs): boolean => {
  if (navigationPinnedPreference === 'pinned') {
    return true;
  }

  if (navigationPinnedPreference === 'unpinned') {
    return false;
  }

  return defaultIsPinned;
};

const getBrandIconSizeStyle = (brandIconBoxSize: 'md' | 'mini' | 'sm') => {
  if (brandIconBoxSize === 'mini') {
    return styles.brandIconSizeMini;
  }

  if (brandIconBoxSize === 'md') {
    return styles.brandIconSizeMd;
  }

  return styles.brandIconSizeSm;
};

const getHeaderDensityStyle = (
  navigationSizePreference: GlobalNavigationSizePreference | undefined,
) => {
  if (navigationSizePreference === 'compact') {
    return styles.headerDensityCompact;
  }

  if (navigationSizePreference === 'small') {
    return styles.headerDensitySmall;
  }

  if (navigationSizePreference === 'large') {
    return styles.headerDensityLarge;
  }

  return;
};

const getBodyDensityStyle = (
  navigationSizePreference: GlobalNavigationSizePreference | undefined,
) => {
  if (navigationSizePreference === 'compact') {
    return styles.bodyDensityCompact;
  }

  if (navigationSizePreference === 'large') {
    return styles.bodyDensityLarge;
  }

  return;
};

const resolveExpandButtonLabel = (isExpanded: boolean): string => {
  if (isExpanded) {
    return 'Collapse navigation';
  }

  return 'Expand navigation';
};

const resolvePinButtonLabel = (isPinned: boolean): string => {
  if (isPinned) {
    return 'Unpin navigation';
  }

  return 'Pin navigation';
};

const resolveThemeLabel = (isDarkMode: boolean): string => {
  if (isDarkMode) {
    return 'Light Mode';
  }

  return 'Dark Mode';
};

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

  // Sync isOpen when isPinned changes externally (e.g. from Settings page)
  useEffect(() => {
    setIsOpen(!isPinned);
  }, [isPinned]);

  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];
  const pinButtonLabel = resolvePinButtonLabel(isPinned);
  const expandButtonLabel = resolveExpandButtonLabel(isExpanded);
  const themeLabel = resolveThemeLabel(isDarkMode);
  const isCollapsed = !isExpanded;
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
    <div
      {...stylex.props(
        styles.headerActions,
        isCollapsed && styles.headerActionsCollapsed,
      )}
    >
      <Button
        aria-label={expandButtonLabel}
        color='ghost'
        icon={
          isExpanded ? (
            <MinimizeIcon size={density.controlIconSize} />
          ) : (
            <MaximizeIcon size={density.controlIconSize} />
          )
        }
        isIconOnly
        onClick={handleToggleExpanded}
        size={density.controlButtonSize}
        title={expandButtonLabel}
        tooltipContent={expandButtonLabel}
        tooltipPlacement={controlTooltipPlacement}
        width='auto'
      />
      <Button
        aria-label={pinButtonLabel}
        color='ghost'
        icon={
          isPinned ? (
            <PinIcon size={density.controlIconSize} />
          ) : (
            <PinOffIcon size={density.controlIconSize} />
          )
        }
        isIconOnly
        onClick={handleTogglePinned}
        size={density.controlButtonSize}
        title={pinButtonLabel}
        tooltipContent={pinButtonLabel}
        tooltipPlacement={controlTooltipPlacement}
        width='auto'
      />
      {isPinned ? undefined : (
        <Button
          aria-label='Close navigation'
          color='ghost'
          icon={<MenuCloseIcon size={density.controlIconSize} />}
          isIconOnly
          onClick={handleClose}
          size={density.controlButtonSize}
          title='Close navigation'
          tooltipContent='Close navigation'
          tooltipPlacement={controlTooltipPlacement}
          width='auto'
        />
      )}
    </div>
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
      <aside
        aria-label='Navigation launcher'
        {...stylex.props(styles.launcher)}
      >
        <Button
          aria-label='Open navigation'
          color='primary'
          customStylex={styles.railControl}
          icon={<MenuIcon size={ICON_SIZE_LG} />}
          isIconOnly
          onClick={handleOpen}
          size='md'
          tooltipContent='Open navigation'
          tooltipPlacement='right'
          width='auto'
        >
          Open navigation
        </Button>
      </aside>
      {panel}
    </>
  );
};
