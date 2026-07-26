import type { GetNavigationItems } from '@lcabrera/ui/contexts/AppConfigContext/AppConfigContext.types';
import type { ThemeMode } from '@lcabrera/ui/types/theme.types';

export type RootComponentProps = {
  /** Per-app id scoping the theme / global-settings cookies across same-host apps. */
  readonly appId?: string;
  /** Theme to use when the request carries no theme cookie. */
  readonly defaultTheme?: ThemeMode;
  /** This app's own route links — see `GetNavigationItems`. */
  readonly getNavigationItems: GetNavigationItems;
  /** Whether this app has a session, i.e. whether the navigation shows session controls. */
  readonly isAuthEnabled?: boolean;
  /** Path the session controls POST to; defaults to `DEFAULT_LOGOUT_ROUTE`. */
  readonly logoutRoute?: string;
};
