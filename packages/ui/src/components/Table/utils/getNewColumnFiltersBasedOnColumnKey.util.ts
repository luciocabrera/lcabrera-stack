import { isShallowEqual } from '@lcabrera/utils/comparison/is-shallow-equal.util';

import type { ColumnFilter } from '#ui/types/filterOperators.types';

import type { ColumnFiltersState, DataKey } from '../Table.types';

type GetNewColumnFiltersBasedOnColumnKeyArgs<TData> = {
  readonly columnFilter?: ColumnFilter;
  readonly columnFiltersState?: ColumnFiltersState<TData>;
  readonly columnKey: DataKey<TData>;
};

export const getNewColumnFiltersBasedOnColumnKey = <TData>({
  columnFilter,
  columnFiltersState = {} as ColumnFiltersState<TData>,
  columnKey,
}: GetNewColumnFiltersBasedOnColumnKeyArgs<TData>) => {
  const prev = columnFiltersState[columnKey];

  if (columnFilter === undefined && prev === undefined) {
    return columnFiltersState;
  }

  if (
    columnFilter !== undefined &&
    prev !== undefined &&
    isShallowEqual({ objA: prev, objB: columnFilter })
  ) {
    return columnFiltersState;
  }

  const next: ColumnFiltersState<TData> = {} as ColumnFiltersState<TData>;

  for (const k in columnFiltersState) {
    if (!Object.hasOwn(columnFiltersState, k)) continue;
    if (k === columnKey) continue;
    next[k as DataKey<TData>] = columnFiltersState[k as DataKey<TData>];
  }

  if (columnFilter !== undefined) {
    next[columnKey] = columnFilter;
  }

  return next;
};
