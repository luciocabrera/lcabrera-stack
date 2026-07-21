import type { TStore } from '@lcabrera/ui/hooks';
import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';
import type { ReactNode } from 'react';

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
