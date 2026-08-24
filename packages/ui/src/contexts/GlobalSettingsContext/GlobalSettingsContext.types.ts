import type { ReactNode } from 'react';

import type { TStore } from '#ui/hooks';
import type { GlobalSettingsState } from '#ui/types/globalSettings.types';

export type GlobalSettingsContextValue = {
  readonly appId?: string;
  readonly settingsStore: TStore<GlobalSettingsState>;
};

export type GlobalSettingsProviderProps = {
  readonly appId?: string;
  readonly children: ReactNode;
  readonly initialSettings?: GlobalSettingsState;
};
