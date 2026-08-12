import type { SortDirection } from '#ui/types/ui.types';

import type { DataKey, SortingState } from '../Table.types';

type GetNewSortingBasedOnColumnKeyArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly existingSorting?: SortingState<TData>;
  readonly sorting?: SortDirection;
};

export const getNewSortingBasedOnColumnKey = <TData>({
  columnKey,
  existingSorting = [],
  sorting,
}: GetNewSortingBasedOnColumnKeyArgs<TData>) => {
  // Sorting: update in-place to preserve order, or remove if undefined;
  if (!sorting) {
    return existingSorting.filter((s) => s.columnKey !== columnKey);
  }

  const hasExistingSort = existingSorting.some(
    (s) => s.columnKey === columnKey,
  );

  if (hasExistingSort) {
    return existingSorting.map((s) =>
      s.columnKey === columnKey ? { columnKey, direction: sorting } : s,
    );
  }

  return [...existingSorting, { columnKey, direction: sorting }];
};
