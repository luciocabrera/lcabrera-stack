import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

export const useSetTableSettingsSelectedTab = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return (tableSettingsSelectedTab: string) => {
    const metaState = metaStore.get();
    const nextStatePatch = { tableSettingsSelectedTab };

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
