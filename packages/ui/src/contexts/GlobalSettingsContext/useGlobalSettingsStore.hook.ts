import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';

import { useStoreSelector } from '@lcabrera/ui/hooks/useStoreSelector.hook';

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
