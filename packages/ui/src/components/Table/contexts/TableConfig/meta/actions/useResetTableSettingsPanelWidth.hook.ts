import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

export const useResetTableSettingsPanelWidth = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return () => {
    const metaState = metaStore.get();

    metaStore.set({ settingsPanelWidth: undefined });
    persistUiFlags({
      currentState: metaState,
      nextStatePatch: { settingsPanelWidth: undefined },
    });
  };
};
