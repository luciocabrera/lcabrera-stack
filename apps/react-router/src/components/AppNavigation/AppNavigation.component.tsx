import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

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
import { useSetGlobalNavigationPreferences } from '@/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationPinnedPreference,
  useGetGlobalNavigationSizePreference,
} from '@/contexts/GlobalSettingsContext/selectors';
import { Toolbar } from '@/components/Toolbar';
import { ICON_SIZE_LG } from '@/design-system/constants';

import { getNavigationItems, NAV_DENSITY } from './AppNavigation.constants';
import { styles } from './AppNavigation.stylex';

import type { AppNavigationProps } from './AppNavigation.types';

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
    return navigationPinnedPreference === 'unpinned';
  });
  const [isExpanded, setIsExpanded] = useState(() => {
    return navigationCollapsedPreference !== 'collapsed';
  });
  const [isPinned, setIsPinned] = useState(() => {
    if (navigationPinnedPreference === 'pinned') {
      return true;
    }

    if (navigationPinnedPreference === 'unpinned') {
      return false;
    }

    return defaultIsPinned;
  });

  useEffect(() => {
    setIsExpanded(navigationCollapsedPreference !== 'collapsed');
  }, [navigationCollapsedPreference]);

  useEffect(() => {
    if (navigationPinnedPreference === 'pinned') {
      setIsPinned(true);
      setIsOpen(false);
      return;
    }

    if (navigationPinnedPreference === 'unpinned') {
      setIsPinned(false);
      setIsOpen(true);
      return;
    }

    setIsPinned(defaultIsPinned);
    setIsOpen(false);
  }, [defaultIsPinned, navigationPinnedPreference]);

  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];
  const pinButtonLabel = isPinned ? 'Unpin navigation' : 'Pin navigation';
  const expandButtonLabel = isExpanded
    ? 'Collapse navigation'
    : 'Expand navigation';
  const themeLabel = isDarkMode ? 'Light Mode' : 'Dark Mode';

  // Brand icon box matches button height per density for visual consistency
  const brandIconSizeStyle =
    density.brandIconBoxSize === 'mini'
      ? styles.brandIconSizeMini
      : density.brandIconBoxSize === 'md'
        ? styles.brandIconSizeMd
        : styles.brandIconSizeSm;

  let headerDensityStyle;
  if (navigationSizePreference === 'compact') {
    headerDensityStyle = styles.headerDensityCompact;
  } else if (navigationSizePreference === 'small') {
    headerDensityStyle = styles.headerDensitySmall;
  } else if (navigationSizePreference === 'large') {
    headerDensityStyle = styles.headerDensityLarge;
  }

  let bodyDensityStyle;
  if (navigationSizePreference === 'compact') {
    bodyDensityStyle = styles.bodyDensityCompact;
  } else if (navigationSizePreference === 'large') {
    bodyDensityStyle = styles.bodyDensityLarge;
  }

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleToggleExpanded = () => {
    setIsExpanded((currentIsExpanded) => {
      const nextIsExpanded = !currentIsExpanded;

      setGlobalNavigationPreferences({
        collapsed: nextIsExpanded ? 'expanded' : 'collapsed',
      });

      return nextIsExpanded;
    });
  };

  const handleTogglePinned = () => {
    setIsPinned((currentIsPinned) => {
      const nextIsPinned = !currentIsPinned;

      setGlobalNavigationPreferences({
        pinned: nextIsPinned ? 'pinned' : 'unpinned',
      });
      setIsOpen(!nextIsPinned);

      return nextIsPinned;
    });
  };

  const headerActions = (
    <div
      {...stylex.props(
        styles.headerActions,
        !isExpanded && styles.headerActionsCollapsed,
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
        tooltipPlacement={isExpanded ? undefined : 'right'}
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
        tooltipPlacement={isExpanded ? undefined : 'right'}
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
          tooltipPlacement={isExpanded ? undefined : 'right'}
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
              !isExpanded && styles.brandCollapsed,
            )}
          >
            <span {...stylex.props(styles.brandIcon, brandIconSizeStyle)}>
              <MenuIcon size={density.brandIconSize} />
            </span>
            <span
              {...stylex.props(
                styles.brandText,
                !isExpanded && styles.brandTextHidden,
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
            tooltipContent={!isExpanded ? themeLabel : undefined}
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
