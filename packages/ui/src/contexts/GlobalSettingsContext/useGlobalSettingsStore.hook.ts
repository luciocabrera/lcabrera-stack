import type { GlobalSettingsState } from '@repo/ui/types/globalSettings.types';

import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import { useGlobalSettingsContextValue } from './useGlobalSettingsContextValue.hook';

export const useGlobalSettingsStore = <TSelected>(
  selector: (state: GlobalSettingsState) => TSelected,
) => {
  const { settingsStore } = useGlobalSettingsContextValue();

  return useStoreSelector({
    selector,
    store: settingsStore,
  });
};
