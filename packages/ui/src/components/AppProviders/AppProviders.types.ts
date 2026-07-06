import type { GlobalSettingsState } from '@repo/ui/types/globalSettings.types';
import type { ThemeMode } from '@repo/ui/types/theme.types';
import type { ReactNode } from 'react';

export type AppProvidersProps = {
  /** Per-app id used to scope theme / global-settings cookies across same-host apps */
  readonly appId?: string;
  readonly children: ReactNode;
  /** Default theme if no cookie/localStorage value exists */
  readonly defaultTheme?: ThemeMode;
  /** Global settings snapshot from the route's own loader */
  readonly globalSettings?: GlobalSettingsState;
  /** Initial theme from SSR loader (cookie value) — takes priority over defaultTheme */
  readonly initialTheme?: ThemeMode;
};
