import { persistTableMetaUiState } from '@/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useToogleTableIsTableSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();
    const isTableSettingsOpen = !metaState?.isTableSettingsOpen;

    const nextStatePatch = {
      isColumnSettingsOpen: isTableSettingsOpen
        ? false
        : (metaState?.isColumnSettingsOpen ?? false),
      isTableSettingsOpen,
    };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
