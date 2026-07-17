import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';
import { usePersistTableUiFlagsAction } from './usePersistTableUiFlagsAction.hook';

export const useToogleTableIsTableSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return () => {
    const metaState = metaStore.get();
    const isTableSettingsOpen = !metaState?.isTableSettingsOpen;

    const nextStatePatch = {
      isColumnSettingsOpen: isTableSettingsOpen
        ? false
        : (metaState?.isColumnSettingsOpen ?? false),
      isTableSettingsOpen,
    };

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
