import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';
import { getNextStatePatch } from './utils';

type SetTableDrawersOpenStateArgs = {
  readonly isColumnSettingsOpen: boolean;
  readonly isTableSettingsOpen: boolean;
};

export const useSetTableDrawersOpenState = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

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

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
