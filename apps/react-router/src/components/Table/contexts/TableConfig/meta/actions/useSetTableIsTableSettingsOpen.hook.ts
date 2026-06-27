import { persistTableMetaUiState } from '@/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableIsTableSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return (isTableSettingsOpen: boolean) => {
    const metaState = metaStore.get();
    const nextStatePatch = { isTableSettingsOpen };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
