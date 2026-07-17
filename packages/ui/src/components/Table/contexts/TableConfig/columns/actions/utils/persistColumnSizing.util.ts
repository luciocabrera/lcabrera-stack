import type {
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import { writeStateSlice } from '@repo/ui/components/Table/utils';

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
 * The cookie is the only channel, because it is the only one the loader can
 * read: `getInitialColumnsState` seeds the store from what the loader passed
 * down, so a width saved here is the width the next document paints with.
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

  writeStateSlice({
    appId: metaState?.appId,
    persistenceKey,
    slice: 'columnSizing',
    storageType: 'cookie',
    value: columnSizing,
  });
};
