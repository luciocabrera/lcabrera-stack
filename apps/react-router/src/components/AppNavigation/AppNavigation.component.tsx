import * as stylex from '@stylexjs/stylex';
import { useCallback, useState } from 'react';

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
import { ICON_SIZE_LG, ICON_SIZE_MD } from '@/design-system/constants';

import { NAVIGATION_ITEMS } from './AppNavigation.constants';
import { styles } from './AppNavigation.stylex';

import type {
  AppNavigationMode,
  AppNavigationProps,
} from './AppNavigation.types';
import type { SidePanelSize } from '@/components/SidePanel';

const getPanelSize = (mode: AppNavigationMode): SidePanelSize => {
  if (mode === 'compact') {
    return 'rail';
  }

  return 'sm';
};

/**
 * Pinned or off-canvas application navigation sidebar.
 */
export const AppNavigation = ({
  defaultIsPinned = true,
  defaultMode = 'full',
  isDarkMode,
  onToggleTheme,
}: AppNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(defaultIsPinned);
  const [mode, setMode] = useState<AppNavigationMode>(defaultMode);

  const isCompact = mode === 'compact';
  const modeButtonLabel = isCompact
    ? 'Show navigation labels'
    : 'Show icon-only navigation';
  const panelSize = getPanelSize(mode);
  const pinButtonLabel = isPinned ? 'Unpin navigation' : 'Pin navigation';
  const themeLabel = isDarkMode ? 'Light Mode' : 'Dark Mode';

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleToggleMode = useCallback(() => {
    setMode((currentMode) => (currentMode === 'compact' ? 'full' : 'compact'));
  }, []);

  const handleTogglePinned = useCallback(() => {
    setIsPinned((currentIsPinned) => !currentIsPinned);
    setIsOpen(false);
  }, []);

  const headerActions = (
    <div
      {...stylex.props(
        styles.headerActions,
        isCompact && styles.headerActionsCompact,
      )}
    >
      <Button
        aria-label={pinButtonLabel}
        color='ghost'
        icon={
          isPinned ? (
            <PinIcon size={ICON_SIZE_MD} />
          ) : (
            <PinOffIcon size={ICON_SIZE_MD} />
          )
        }
        onClick={handleTogglePinned}
        size='mini'
        title={pinButtonLabel}
        tooltipContent={pinButtonLabel}
        width='auto'
      />
      <Button
        aria-label={modeButtonLabel}
        color='ghost'
        icon={
          isCompact ? (
            <MaximizeIcon size={ICON_SIZE_MD} />
          ) : (
            <MinimizeIcon size={ICON_SIZE_MD} />
          )
        }
        onClick={handleToggleMode}
        size='mini'
        title={modeButtonLabel}
        tooltipContent={modeButtonLabel}
        width='auto'
      />
      {!isPinned ? (
        <Button
          aria-label='Close navigation'
          color='ghost'
          icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
          onClick={handleClose}
          size='mini'
          title='Close navigation'
          tooltipContent='Close navigation'
          width='auto'
        />
      ) : undefined}
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
      size={panelSize}
    >
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.headerRow)}>
          <div
            {...stylex.props(styles.brand, isCompact && styles.brandCompact)}
          >
            <span {...stylex.props(styles.brandIcon)}>
              <MenuIcon size={ICON_SIZE_LG} />
            </span>
            <span
              {...stylex.props(
                styles.brandText,
                isCompact && styles.brandTextHidden,
              )}
            >
              Navigation
            </span>
          </div>
          {!isCompact ? headerActions : undefined}
        </div>
        {isCompact ? headerActions : undefined}
      </header>
      <SidePanelBody>
        <div {...stylex.props(styles.bodyContent)}>
          <Toolbar
            aria-label='Main navigation links'
            data-testid='main-navigation'
            items={NAVIGATION_ITEMS}
            orientation='vertical'
          />
        </div>
      </SidePanelBody>
      <SidePanelFooter>
        <div {...stylex.props(styles.footer)}>
          <Button
            color='ghost'
            icon={isDarkMode ? '☀️' : '🌙'}
            onClick={onToggleTheme}
            size='sm'
            tooltipContent={themeLabel}
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
          icon={<MenuIcon size={ICON_SIZE_LG} />}
          onClick={handleOpen}
          size='md'
          tooltipContent='Open navigation'
          width='full'
        >
          Open navigation
        </Button>
      </aside>
      {panel}
    </>
  );
};
