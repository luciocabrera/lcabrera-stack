import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

export const useSetTableColumnSettingsSelectedTab = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return (columnSettingsSelectedTab: string) => {
    const metaState = metaStore.get();
    const nextStatePatch = { columnSettingsSelectedTab };

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
