import type { ColumnFilter } from '@/types/filterOperators.types';

import { shallowEqual } from '@/utils';

import type { ColumnFiltersState, DataKey } from '../Table.types';

type GetNewColumnFiltersBasedOnColumnKeyArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnFilter?: ColumnFilter;
  readonly columnFiltersState?: ColumnFiltersState<TData>;
};

export const getNewColumnFiltersBasedOnColumnKey = <TData>({
  columnFiltersState = {} as ColumnFiltersState<TData>,
  columnKey,
  columnFilter,
}: GetNewColumnFiltersBasedOnColumnKeyArgs<TData>) => {
  const prev = columnFiltersState[columnKey];

  // No-op: removing a non-existent key
  if (columnFilter === undefined && prev === undefined) {
    return columnFiltersState;
  }

  // No-op: setting same filter (shallow equality)
  if (
    columnFilter !== undefined &&
    prev !== undefined &&
    shallowEqual({ objA: prev, objB: columnFilter })
  ) {
    return columnFiltersState;
  }

  // Need a new object (add/update/remove). Build it in one pass without mutating input.
  const next: ColumnFiltersState<TData> = {} as ColumnFiltersState<TData>;

  for (const k in columnFiltersState) {
    if (!Object.hasOwn(columnFiltersState, k)) continue;
    if (k === columnKey) continue; // skip the key being changed/removed
    next[k as DataKey<TData>] = columnFiltersState[k as DataKey<TData>];
  }

  if (columnFilter !== undefined) {
    next[columnKey] = columnFilter;
  }

  return next;
};
