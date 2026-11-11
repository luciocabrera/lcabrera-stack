import { use } from 'react';

import { INITIAL_GLOBAL_SETTINGS } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.constants';
import { GlobalSettingsContext } from '#ui/contexts/GlobalSettingsContext/GlobalSettingsContext.context';
import { useStore } from '#ui/hooks/useStore.hook';
import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

export const useGlobalTableDensityDefaults = () => {
  const context = use(GlobalSettingsContext);
  const detachedStore = useStore(INITIAL_GLOBAL_SETTINGS);

  return useStoreSelector({
    selector: (state) => state.tableDisplay,
    store: context?.settingsStore ?? detachedStore,
  });
};
