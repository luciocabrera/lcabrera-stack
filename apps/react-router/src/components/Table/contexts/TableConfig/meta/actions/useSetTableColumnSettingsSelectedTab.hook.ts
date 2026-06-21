import { persistTableMetaUiState } from '@/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableColumnSettingsSelectedTab = () => {
  const { metaStore } = useTableConfigContextValue();

  return (columnSettingsSelectedTab: string) => {
    const metaState = metaStore.get();
    const nextStatePatch = { columnSettingsSelectedTab };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
