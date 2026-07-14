import { persistTableMetaUiState } from '@repo/ui/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

import { getNextStatePatch } from './utils';

type SetTableDrawersOpenStateArgs = {
  readonly isColumnSettingsOpen: boolean;
  readonly isTableSettingsOpen: boolean;
};

export const useSetTableDrawersOpenState = () => {
  const { metaStore } = useTableConfigContextValue();

  return ({
    isColumnSettingsOpen,
    isTableSettingsOpen,
  }: SetTableDrawersOpenStateArgs) => {
    const metaState = metaStore.get();
    const nextStatePatch = getNextStatePatch({
      isColumnSettingsOpen,
      isTableSettingsOpen,
      metaState,
    });

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
