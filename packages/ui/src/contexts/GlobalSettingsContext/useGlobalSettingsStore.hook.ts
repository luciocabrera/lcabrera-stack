import { useSyncExternalStore } from 'react';

import type { GlobalSettingsState } from '@repo/ui/types/globalSettings.types';

import { INITIAL_GLOBAL_SETTINGS } from './GlobalSettingsContext.constants';
import { useGlobalSettingsContextValue } from './useGlobalSettingsContextValue.hook';

export const useGlobalSettingsStore = <TSelected>(
  selector: (state: GlobalSettingsState) => TSelected,
) => {
  const { settingsStore } = useGlobalSettingsContextValue();

  const getSnapshot = () => settingsStore.get() ?? INITIAL_GLOBAL_SETTINGS;
  const getServerSnapshot = () =>
    settingsStore.getServerSnapshot() ?? INITIAL_GLOBAL_SETTINGS;

  return useSyncExternalStore(
    settingsStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
};
