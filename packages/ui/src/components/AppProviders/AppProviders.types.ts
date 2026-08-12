import type { ReactNode } from 'react';

import type { GlobalSettingsState } from '#ui/types/globalSettings.types';
import type { ThemeMode } from '#ui/types/theme.types';

/**
 * The subset of the root-route loader's data this component reads — kept
 * minimal and local rather than importing an app's own loader type, since that
 * type is app-specific and this component is not. `getRootLoaderData`
 * (`@lcabrera/ui/routing/shared`) returns a superset of it, so an app whose root
 * loader delegates to that helper satisfies this by construction.
 */
export type AppProvidersLoaderData = {
  readonly globalSettings?: GlobalSettingsState;
  readonly theme?: ThemeMode;
};

export type AppProvidersProps = {
  /** Per-app id used to scope theme / global-settings cookies across same-host apps */
  readonly appId?: string;
  readonly children: ReactNode;
  /** Theme to use when the root loader supplies none */
  readonly defaultTheme?: ThemeMode;
};
