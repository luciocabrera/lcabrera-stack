import type { TableMetaState } from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import { persistTableMetaUiState } from '@repo/ui/components/Table/utils';

type CloseColumnSettingsDrawerArgs = {
  readonly metaStore: TStore<TableMetaState>;
};

/**
 * Close the column settings drawer, restoring the table settings drawer when it
 * was open beforehand, and persist the resulting UI state.
 * @param args - The table meta store.
 */
export const closeColumnSettingsDrawer = ({
  metaStore,
}: CloseColumnSettingsDrawerArgs) => {
  const metaState = metaStore.get();
  const shouldRestoreTableSettings =
    metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;
  const isTableSettingsOpen = shouldRestoreTableSettings
    ? true
    : (metaState?.isTableSettingsOpen ?? false);

  const nextStatePatch = {
    isColumnSettingsOpen: false,
    isTableSettingsOpen,
    wasTableSettingsOpenBeforeColumnSettings: false,
  };

  persistTableMetaUiState({
    currentState: metaState,
    nextStatePatch,
  });
  metaStore.set(nextStatePatch);
};
