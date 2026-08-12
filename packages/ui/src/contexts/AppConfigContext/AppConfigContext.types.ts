import type { ReactNode } from 'react';

import type { NavbarItemConfig } from '#ui/components/Navbar/Navbar.types';

export type AppConfigContextValue = {
  readonly getNavigationItems: GetNavigationItems;
  readonly isAuthEnabled: boolean;
  readonly logoutRoute: string;
};

export type AppConfigProviderProps = {
  readonly children: ReactNode;
  readonly getNavigationItems: GetNavigationItems;
  /** Whether this app has a session, i.e. whether the navigation shows session controls. */
  readonly isAuthEnabled?: boolean;
  /** Path the session controls POST to; defaults to `DEFAULT_LOGOUT_ROUTE`. */
  readonly logoutRoute?: string;
};

/**
 * Builds the consuming app's own route links at the icon size the navigation's
 * density preference asks for. Every app supplies its own — the package has no
 * way to know an app's routes.
 */
export type GetNavigationItems = (
  iconSize: number,
) => readonly NavbarItemConfig[];
