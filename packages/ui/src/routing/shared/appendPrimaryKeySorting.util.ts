import type { SortingState, TableColumn } from '#ui/components/Table';

import { resolvePrimaryKeyColumnKeys } from '#ui/components/Table/utils';

type AppendPrimaryKeySortingArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly sorting: SortingState<TData>;
};

export const appendPrimaryKeySorting = <TData>({
  columns,
  sorting,
}: AppendPrimaryKeySortingArgs<TData>) => {
  const existingKeys = new Set(sorting.map((entry) => entry.columnKey));
  const appended = resolvePrimaryKeyColumnKeys({ columns })
    .filter((columnKey) => !existingKeys.has(columnKey))
    .map((columnKey) => ({ columnKey, direction: 'asc' as const }));

  return [...sorting, ...appended];
};
