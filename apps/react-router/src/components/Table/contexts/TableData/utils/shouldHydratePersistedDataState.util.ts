import type { TableDataState } from '@/components/Table/Table.types';
import type { PersistedDataState } from '@/components/Table/utils/persistence.types';

type ShouldHydratePersistedDataStateArgs<TData> = {
  readonly initialDataState?: Partial<TableDataState<TData>>;
  readonly persistedDataState?: PersistedDataState<TData>;
};

const areRowsEqual = <TData>(
  leftRow: TData | undefined,
  rightRow: TData | undefined,
): boolean => JSON.stringify(leftRow) === JSON.stringify(rightRow);

/**
 * Rehydrates persisted rows only when they belong to the same query snapshot.
 * We treat the current loader page as source of truth and require it to match
 * the prefix of persisted rows with the same total count.
 */
export const shouldHydratePersistedDataState = <TData>({
  initialDataState,
  persistedDataState,
}: ShouldHydratePersistedDataStateArgs<TData>): boolean => {
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
    areRowsEqual(persistedDataState.data[index], row),
  );
};
