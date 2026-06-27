import { persistTableMetaUiState } from '@/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableIsTableSettingsPinned = () => {
  const { metaStore } = useTableConfigContextValue();

  return (isTableSettingsPinned: boolean) => {
    const metaState = metaStore.get();
    const nextStatePatch = { isTableSettingsPinned };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
