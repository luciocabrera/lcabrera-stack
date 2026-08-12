import { getClosedColumnSettingsStatePatch } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils';
import { usePersistTableUiFlagsAction } from '#ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

/**
 * Closes the column settings drawer: reads the current meta state, computes the
 * closed-drawer patch, persists it, and applies it to the meta store. Shared by
 * the clear-all and reset-all drawer actions so the close-on-request tail lives
 * in one place.
 */
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
