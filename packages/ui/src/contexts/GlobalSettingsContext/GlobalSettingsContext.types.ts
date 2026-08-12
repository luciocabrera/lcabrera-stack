import type { ReactNode } from 'react';

import type { TStore } from '#ui/hooks';
import type { GlobalSettingsState } from '#ui/types/globalSettings.types';

export type GlobalSettingsContextValue = {
  /** Per-app id used to scope the persisted global-settings cookie key. */
  readonly appId?: string;
  readonly settingsStore: TStore<GlobalSettingsState>;
};

export type GlobalSettingsProviderProps = {
  /** Per-app id used to scope the persisted global-settings cookie key. */
  readonly appId?: string;
  readonly children: ReactNode;
  readonly initialSettings?: GlobalSettingsState;
};
