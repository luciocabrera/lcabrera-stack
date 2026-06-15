import { useEffect } from 'react';

import type { TableMetaState } from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

import type { PersistedUiState } from '../utils/persistence.types';

import { writePersistedUiStateToSessionStorage } from '../utils';

type UseMetaStatePersistEffectArgs = {
  readonly metaStore: TStore<TableMetaState>;
  readonly persistenceKey: string;
};

const extractUiState = (
  state: TableMetaState | undefined,
): PersistedUiState => ({
  columnSettingsSelectedTab: state?.columnSettingsSelectedTab,
  isColumnSettingsOpen: state?.isColumnSettingsOpen,
  isColumnSettingsPinned: state?.isColumnSettingsPinned,
  isTableSettingsPinned: state?.isTableSettingsPinned,
  isTableSettingsOpen: state?.isTableSettingsOpen,
  tableSettingsExpandedFilters: state?.tableSettingsExpandedFilters,
  tableSettingsSelectedTab: state?.tableSettingsSelectedTab,
});

/**
 * Subscribes to metaStore and writes the meta UI slices to sessionStorage on
 * every change. This ensures drawer open/closed state, pinned state, selected
 * tab, and expanded filters survive a tab refresh.
 *
 * sessionStorage is tab-scoped so other tabs are never affected.
 *
 * Called once per table mount inside TableConfigProvider.
 */
export const useMetaStatePersistEffect = ({
  metaStore,
  persistenceKey,
}: UseMetaStatePersistEffectArgs): void => {
  useEffect(() => {
    const write = () => {
      const state = metaStore.get();
      writePersistedUiStateToSessionStorage({
        persistenceKey,
        uiState: extractUiState(state),
      });
    };

    // Write immediately so an initial state is captured
    write();

    return metaStore.subscribe(write);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
