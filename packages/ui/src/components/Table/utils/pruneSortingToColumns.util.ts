import type { SortingState } from '#ui/components/Table/Table.types';

type PruneSortingToColumnsArgs<TData> = {
  readonly declaredColumnKeys: readonly string[];
  readonly gridColumnKeys: readonly string[];
  readonly sorting: SortingState<TData>;
};

export const pruneSortingToColumns = <TData>({
  declaredColumnKeys,
  gridColumnKeys,
  sorting,
}: PruneSortingToColumnsArgs<TData>): SortingState<TData> => {
  const orderable = new Set([...gridColumnKeys, ...declaredColumnKeys]);
  const kept = sorting.filter((entry) =>
    orderable.has(String(entry.columnKey)),
  );

  return kept.length === sorting.length ? sorting : kept;
};
