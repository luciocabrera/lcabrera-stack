import { persistTableMetaUiState } from '@repo/ui/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableIsColumnSettingsPinned = () => {
  const { metaStore } = useTableConfigContextValue();

  return (isColumnSettingsPinned: boolean) => {
    const metaState = metaStore.get();
    const nextStatePatch = { isColumnSettingsPinned };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
