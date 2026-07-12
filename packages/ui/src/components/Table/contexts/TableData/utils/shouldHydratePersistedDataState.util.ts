import type { TableDataState } from '@repo/ui/components/Table/Table.types';
import type { PersistedDataState } from '@repo/ui/components/Table/utils/persistence.types';

import { areEqualByJson } from '@repo/ui/utils/comparison/areEqualByJson.util';

type ShouldHydratePersistedDataStateArgs<TData> = {
  readonly initialDataState?: Partial<TableDataState<TData>>;
  readonly persistedDataState?: PersistedDataState<TData>;
};

/**
 * Rehydrates persisted rows only when they belong to the same query snapshot.
 * We treat the current loader page as source of truth and require it to match
 * the prefix of persisted rows with the same total count.
 */
export const shouldHydratePersistedDataState = <TData>({
  initialDataState,
  persistedDataState,
}: ShouldHydratePersistedDataStateArgs<TData>) => {
  if (persistedDataState === undefined) {
    return false;
  }

  const initialData = initialDataState?.data ?? [];
  const initialTotalRows = initialDataState?.totalRows ?? 0;

  if (initialData.length === 0 || initialTotalRows === 0) {
    return false;
  }

  if (persistedDataState.totalRows !== initialTotalRows) {
    return false;
  }

  if (persistedDataState.data.length < initialData.length) {
    return false;
  }

  return initialData.every((row, index) =>
    areEqualByJson({
      left: persistedDataState.data[index],
      right: row,
    }),
  );
};
