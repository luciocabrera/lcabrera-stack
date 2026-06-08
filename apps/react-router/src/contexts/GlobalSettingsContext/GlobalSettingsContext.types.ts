import type { ReactNode } from 'react';

import type { TStore } from '@/hooks';
import type { GlobalSettingsState } from '@/types/globalSettings.types';

export type GlobalSettingsContextValue = {
  readonly settingsStore: TStore<GlobalSettingsState>;
};

export type GlobalSettingsProviderProps = {
  readonly children: ReactNode;
  readonly initialSettings?: GlobalSettingsState;
};
