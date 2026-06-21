import { persistTableMetaUiState } from '@/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableSettingsExpandedFilters = () => {
  const { metaStore } = useTableConfigContextValue();

  return (tableSettingsExpandedFilters: readonly string[]) => {
    const metaState = metaStore.get();
    const nextStatePatch = { tableSettingsExpandedFilters };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
