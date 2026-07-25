import type { GetNavigationItems } from '@lcabrera/ui/contexts/AppConfigContext/AppConfigContext.types';
import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';
import type { ThemeMode } from '@lcabrera/ui/types/theme.types';

/**
 * The subset of the root-route loader's data this component reads — kept
 * minimal and local rather than importing an app's own loader type, since that
 * type is app-specific and this component is not. `getRootLoaderData`
 * (`@lcabrera/ui/routing/shared`) returns a superset of it, so an app whose root
 * loader delegates to that helper satisfies this by construction.
 */
export type RootComponentLoaderData = {
  readonly globalSettings?: GlobalSettingsState;
  readonly theme?: ThemeMode;
};

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
