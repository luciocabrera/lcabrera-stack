import { useEffect, useRef } from 'react';

import type { TableMetaState } from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

import type { PersistedUiState } from '../utils/persistence.types';

import {
  arePersistedUiStatesEqual,
  writePersistedUiStateToSessionStorage,
} from '../utils';

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
  isTableSettingsOpen: state?.isTableSettingsOpen,
  isTableSettingsPinned: state?.isTableSettingsPinned,
  tableSettingsExpandedFilters: state?.tableSettingsExpandedFilters,
  tableSettingsSelectedTab: state?.tableSettingsSelectedTab,
});

/**
 * Subscribes to metaStore and writes the meta UI slices to sessionStorage only
 * when the persisted UI slice changes. This ensures drawer open/closed state,
 * pinned state, selected tab, and expanded filters survive a tab refresh while
 * avoiding redundant writes for non-persisted meta updates.
 *
 * sessionStorage is tab-scoped so other tabs are never affected.
 *
 * Called once per table mount inside TableConfigProvider.
 */
export const useMetaStatePersistEffect = ({
  metaStore,
  persistenceKey,
}: UseMetaStatePersistEffectArgs): void => {
  const lastUiStateRef = useRef<PersistedUiState | undefined>(undefined);

  useEffect(() => {
    if (persistenceKey === '') {
      return;
    }

    const write = (isInitialWrite = false) => {
      const state = metaStore.get();
      const nextUiState = extractUiState(state);

      if (
        !isInitialWrite &&
        lastUiStateRef.current &&
        arePersistedUiStatesEqual({
          left: lastUiStateRef.current,
          right: nextUiState,
        })
      ) {
        return;
      }

      writePersistedUiStateToSessionStorage({
        persistenceKey,
        uiState: nextUiState,
      });
      lastUiStateRef.current = nextUiState;
    };

    // Write immediately so an initial state is captured
    write(true);

    return metaStore.subscribe(write);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
