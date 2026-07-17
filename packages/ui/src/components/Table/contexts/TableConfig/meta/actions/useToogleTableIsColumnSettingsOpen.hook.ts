import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';
import { getNextToggleColumnSettingsStatePatch } from './utils';

export const useToogleTableIsColumnSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return () => {
    const metaState = metaStore.get();
    const nextStatePatch = getNextToggleColumnSettingsStatePatch({
      metaState,
    });

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
