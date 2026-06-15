import { useEffect } from 'react';

import type {
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

import {
  readPersistedStateFromSessionStorage,
  readPersistedUiStateFromSessionStorage,
} from '../utils';

type UseHydrateTableSessionStateArgs = {
  readonly columnsStore: TStore<TableColumnsState>;
  readonly metaStore: TStore<TableMetaState>;
  readonly persistenceKey: string;
};

/**
 * Reads tab-scoped sessionStorage state after client mount and merges it into
 * both stores. This overwrites the server-provided initial state with the
 * per-tab working copy so that a tab refresh restores exactly where the user
 * left off without affecting other tabs.
 *
 * - Column slices: order, pinning, sizing, visibility, sorting, filters
 * - Meta UI slices: drawer open/pinned state, selected tab, expanded filters
 *
 * Called once per table mount inside TableConfigProvider.
 */
export const useHydrateTableSessionState = ({
  columnsStore,
  metaStore,
  persistenceKey,
}: UseHydrateTableSessionStateArgs): void => {
  useEffect(() => {
    const columnState = readPersistedStateFromSessionStorage({
      persistenceKey,
    });
    const uiState = readPersistedUiStateFromSessionStorage({ persistenceKey });

    const hasColumnState = Object.keys(columnState).length > 0;
    const hasUiState = Object.keys(uiState).length > 0;

    if (hasColumnState) {
      const { columnVisibility, ...rest } = columnState;
      columnsStore.set({
        ...rest,
        ...(columnVisibility === undefined ? {} : { columnVisibility }),
      });
    }

    if (hasUiState) {
      metaStore.set(uiState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
