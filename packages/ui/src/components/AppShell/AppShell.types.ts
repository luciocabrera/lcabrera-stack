import type { NavbarItemConfig } from '@/components/Navbar/Navbar.types';

export type AppShellProps = {
  /** Forwarded to `AppNavigation` — see its own prop doc for why this is app-supplied. */
  readonly getNavigationItems: (
    iconSize: number,
  ) => readonly NavbarItemConfig[];
};
