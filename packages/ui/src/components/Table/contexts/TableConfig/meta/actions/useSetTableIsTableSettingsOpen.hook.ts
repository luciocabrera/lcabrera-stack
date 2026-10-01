import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

export const useSetTableIsTableSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return (isTableSettingsOpen: boolean) => {
    const metaState = metaStore.get();

    if (metaState.isTableSettingsOpen === isTableSettingsOpen) {
      return;
    }

    const nextStatePatch = { isTableSettingsOpen };

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
