import type { GlobalSettingsState } from '@repo/ui/types/globalSettings.types';

import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import { INITIAL_GLOBAL_SETTINGS } from './GlobalSettingsContext.constants';
import { useGlobalSettingsContextValue } from './useGlobalSettingsContextValue.hook';

export const useGlobalSettingsStore = <TSelected>(
  selector: (state: GlobalSettingsState) => TSelected,
) => {
  const { settingsStore } = useGlobalSettingsContextValue();

  return useStoreSelector({
    fallback: INITIAL_GLOBAL_SETTINGS,
    selector,
    store: settingsStore,
  });
};
