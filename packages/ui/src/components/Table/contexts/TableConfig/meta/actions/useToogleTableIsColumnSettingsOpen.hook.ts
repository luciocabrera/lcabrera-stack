import { persistTableMetaUiState } from '@repo/ui/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { getNextToggleColumnSettingsStatePatch } from './utils';

export const useToogleTableIsColumnSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();
    const nextStatePatch = getNextToggleColumnSettingsStatePatch({
      metaState,
    });

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
