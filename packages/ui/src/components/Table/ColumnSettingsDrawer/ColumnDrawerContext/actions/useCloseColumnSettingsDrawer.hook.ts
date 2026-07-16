import { getClosedColumnSettingsStatePatch } from '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils';
import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { persistTableMetaUiState } from '@repo/ui/components/Table/utils';

/**
 * Closes the column settings drawer: reads the current meta state, computes the
 * closed-drawer patch, persists it, and applies it to the meta store. Shared by
 * the clear-all and reset-all drawer actions so the close-on-request tail lives
 * in one place.
 */
export const useCloseColumnSettingsDrawer = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();
    const nextStatePatch = getClosedColumnSettingsStatePatch({ metaState });

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
