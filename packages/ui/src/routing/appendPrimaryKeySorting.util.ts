import type { SortingState, TableColumn } from '@lcabrera/ui/components/Table';

import { resolvePrimaryKeyColumnKeys } from '@lcabrera/ui/components/Table/utils';

type AppendPrimaryKeySortingArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly sorting: SortingState<TData>;
};

/**
 * Append the primary-key column(s) to the sort (ascending, in column
 * declaration order) so server pagination has a stable, deterministic
 * ordering. A primary-key column already present in `sorting` keeps the user's
 * entry in place and is not duplicated.
 */
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
