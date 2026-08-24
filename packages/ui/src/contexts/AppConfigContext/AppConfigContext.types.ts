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
  readonly isAuthEnabled?: boolean;
  readonly logoutRoute?: string;
};

export type GetNavigationItems = (
  iconSize: number,
) => readonly NavbarItemConfig[];
