import { getClosedColumnSettingsStatePatch } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils';
import { usePersistTableUiFlagsAction } from '#ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

export const useCloseColumnSettingsDrawer = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return () => {
    const metaState = metaStore.get();
    const nextStatePatch = getClosedColumnSettingsStatePatch({ metaState });

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
