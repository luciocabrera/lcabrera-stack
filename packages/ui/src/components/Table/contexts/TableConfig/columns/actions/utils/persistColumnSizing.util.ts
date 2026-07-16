import type {
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import {
  serializeStateSlice,
  writeStateSlice,
} from '@repo/ui/components/Table/utils';
import { writeToSessionStorage } from '@repo/ui/utils/storage';

type PersistColumnSizingArgs<TData> = {
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  readonly metaStore: TStore<TableMetaState>;
};

/**
 * Persists whatever column widths are currently in the store, scoped to the
 * table's app + persistence key. A no-op until the table has a persistence key
 * or any width to save.
 *
 * Shared by every sizing action so they never have to call one another. Reads
 * the store rather than taking a width, so it always saves the committed state
 * even when the caller wrote it a moment earlier.
 *
 * Writes both persistence channels, exactly like `usePersistTableStateAction`:
 * the cookie is the SSR baseline the loader reads, and sessionStorage is what
 * `getInitialColumnsState` reads back on the client. Writing only the cookie
 * leaves a stale sessionStorage entry to win at hydration, which both reverts
 * the resize and shifts the columns after the skeleton has already painted.
 */
export const persistColumnSizing = <TData>({
  columnsStore,
  metaStore,
}: PersistColumnSizingArgs<TData>) => {
  const columnSizing = columnsStore.get()?.columnSizing;
  const metaState = metaStore.get();
  const persistenceKey = metaState?.persistenceKey;

  if (!columnSizing || !persistenceKey) {
    return;
  }

  const appId = metaState?.appId;
  const { key, value } = serializeStateSlice({
    appId,
    persistenceKey,
    slice: 'columnSizing',
    value: columnSizing,
  });

  writeToSessionStorage({ key, value });

  writeStateSlice({
    appId,
    persistenceKey,
    slice: 'columnSizing',
    storageType: 'cookie',
    value: columnSizing,
  });
};
