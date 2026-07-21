import type { TStore } from '@lcabrera/ui/hooks/useStore.hook';
import type { ReactNode } from 'react';

import type { SettingsDraft } from '../Settings.types';

export type SettingsDraftChanges = {
  readonly hasChanges: boolean;
  readonly hasNavigationChanges: boolean;
  readonly hasPinningChanges: boolean;
};

export type SettingsDraftContextValue = {
  readonly draftStore: TStore<SettingsDraft>;
};

export type SettingsDraftProviderProps = {
  readonly children: ReactNode;
};
