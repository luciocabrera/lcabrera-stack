import type { SortingState } from '#ui/components/Table/Table.types';

import { compareCellValues } from './compareCellValues.util';

type CompareRowsBySortingArgs<TData extends Record<string, unknown>> = {
  readonly left: TData;
  readonly right: TData;
  readonly sorting: SortingState<TData>;
};

export const compareRowsBySorting = <TData extends Record<string, unknown>>({
  left,
  right,
  sorting,
}: CompareRowsBySortingArgs<TData>) => {
  for (const { columnKey, direction } of sorting) {
    if (direction === undefined) continue;

    const order = compareCellValues({
      left: left[columnKey],
      right: right[columnKey],
    });

    if (order !== 0) return direction === 'desc' ? -order : order;
  }

  return 0;
};
