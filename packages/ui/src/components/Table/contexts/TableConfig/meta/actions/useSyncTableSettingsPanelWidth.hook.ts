import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

export const useSyncTableSettingsPanelWidth = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return () => {
    const metaState = metaStore.get();

    persistUiFlags({
      currentState: metaState,
      nextStatePatch: { settingsPanelWidth: metaState.settingsPanelWidth },
    });
  };
};
