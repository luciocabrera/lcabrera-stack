import type { NavbarItemConfig } from '@/components/Navbar/Navbar.types';

export type AppNavigationProps = {
  readonly defaultIsPinned?: boolean;
  readonly getNavigationItems: (
    iconSize: number,
  ) => readonly NavbarItemConfig[];
};
