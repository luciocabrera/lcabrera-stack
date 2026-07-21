import type { NavigationSessionActions } from '@lcabrera/ui/components/AppNavigation/AppNavigation.types';
import type { NavbarItemConfig } from '@lcabrera/ui/components/Navbar/Navbar.types';

export type AppShellProps = {
  /** Forwarded to `AppNavigation` — see its own prop doc for why this is app-supplied. */
  readonly getNavigationItems: (
    iconSize: number,
  ) => readonly NavbarItemConfig[];
  /**
   * Optional session-action slot rendered in the navigation footer (e.g. a
   * logout control). A render-prop so it can adapt to the sidebar's collapsed
   * state — see `NavigationSessionActions`.
   */
  readonly sessionActions?: NavigationSessionActions;
};
