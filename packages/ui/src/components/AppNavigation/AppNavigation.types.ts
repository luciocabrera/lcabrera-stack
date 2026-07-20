import type { ReactNode } from 'react';

import type { NavbarItemConfig } from '@/components/Navbar/Navbar.types';

export type AppNavigationProps = {
  readonly defaultIsPinned?: boolean;
  readonly getNavigationItems: (
    iconSize: number,
  ) => readonly NavbarItemConfig[];
  readonly sessionActions?: NavigationSessionActions;
};

/**
 * Render-prop for the navigation footer's session-action slot (e.g. a logout
 * control). The navigation passes its current collapsed state so the app can
 * render an icon-only control — with a tooltip — when the sidebar is collapsed,
 * matching the theme toggle beside it. Optional: apps without a session concept
 * simply omit it and the footer shows the theme toggle alone.
 */
export type NavigationSessionActions = (args: {
  readonly isCollapsed: boolean;
}) => ReactNode;
