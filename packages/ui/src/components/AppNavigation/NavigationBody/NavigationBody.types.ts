import type { NavbarItemConfig } from '@lcabrera/ui/components/Navbar/Navbar.types';

/**
 * NavigationBody component props
 */
export type NavigationBodyProps = {
  /**
   * Returns this app's own route links, sized for the given icon size.
   * Forwarded from `AppNavigationProps.getNavigationItems`.
   */
  readonly getNavigationItems: (
    iconSize: number,
  ) => readonly NavbarItemConfig[];
};
