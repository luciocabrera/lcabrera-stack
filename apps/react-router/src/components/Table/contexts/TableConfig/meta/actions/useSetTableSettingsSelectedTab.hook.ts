import { persistTableMetaUiState } from '@/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableSettingsSelectedTab = () => {
  const { metaStore } = useTableConfigContextValue();

  return (tableSettingsSelectedTab: string) => {
    const metaState = metaStore.get();
    const nextStatePatch = { tableSettingsSelectedTab };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
