import type { ReactNode } from 'react';

import type { GlobalSettingsState } from '#ui/types/globalSettings.types';
import type { ThemeMode } from '#ui/types/theme.types';

export type AppProvidersLoaderData = {
  readonly globalSettings?: GlobalSettingsState;
  readonly theme?: ThemeMode;
};

export type AppProvidersProps = {
  readonly appId?: string;
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeMode;
};
