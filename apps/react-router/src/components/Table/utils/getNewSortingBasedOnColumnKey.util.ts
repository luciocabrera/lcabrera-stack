import type { SortDirection } from '@/types/ui.types';

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
  const existingIndex = existingSorting.findIndex(
    (s) => s.columnKey === columnKey,
  );

  const hasExistingSort = existingIndex !== -1;

  let newSorting;
  if (!sorting) {
    newSorting = existingSorting.filter((s) => s.columnKey !== columnKey);
  } else if (hasExistingSort) {
    newSorting = existingSorting.map((s) =>
      s.columnKey === columnKey ? { columnKey, direction: sorting } : s,
    );
  } else {
    newSorting = [...existingSorting, { columnKey, direction: sorting }];
  }

  return newSorting;
};
