import { SidePanel } from '@lcabrera/ui/components/SidePanel';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationPinnedPreference,
  useGetGlobalNavigationSizePreference,
} from '@lcabrera/ui/contexts/GlobalSettingsContext/selectors';
import { useTheme } from '@lcabrera/ui/hooks/useTheme.hook';
import { useState } from 'react';

import type { AppNavigationProps } from './AppNavigation.types';

import { NAV_DENSITY } from './AppNavigation.constants';
import { NavigationBody } from './NavigationBody/NavigationBody.component';
import { NavigationFooter } from './NavigationFooter/NavigationFooter.component';
import { NavigationHeader } from './NavigationHeader/NavigationHeader.component';
import { NavigationLauncher } from './NavigationLauncher';
import { isNavigationPinned } from './utils';

/**
 * Pinned or off-canvas application navigation sidebar: a SidePanel composed
 * of a header (brand + expand/pin/close actions), a body (app-supplied route
 * links), and a footer (theme toggle). When unpinned, a floating launcher
 * button reopens the off-canvas panel.
 */
export const AppNavigation = ({
  defaultIsPinned = true,
  getNavigationItems,
  sessionActions,
}: AppNavigationProps) => {
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationPinnedPreference = useGetGlobalNavigationPinnedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();
  const { isDarkMode, toggleTheme } = useTheme();

  const isPinned = isNavigationPinned({
    defaultIsPinned,
    navigationPinnedPreference,
  });

  const [isOpen, setIsOpen] = useState(!isPinned);

  const isExpanded = navigationCollapsedPreference !== 'collapsed';
  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

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
      <NavigationHeader isPinned={isPinned} onClose={handleClose} />
      <NavigationBody getNavigationItems={getNavigationItems} />
      <NavigationFooter
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        sessionActions={sessionActions}
      />
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
