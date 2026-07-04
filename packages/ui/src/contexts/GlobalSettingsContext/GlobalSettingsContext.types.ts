import type { ReactNode } from 'react';

import type { TStore } from '@repo/ui/hooks';
import type { GlobalSettingsState } from '@repo/ui/types/globalSettings.types';

export type GlobalSettingsContextValue = {
  readonly settingsStore: TStore<GlobalSettingsState>;
};

export type GlobalSettingsProviderProps = {
  readonly children: ReactNode;
  readonly initialSettings?: GlobalSettingsState;
};
