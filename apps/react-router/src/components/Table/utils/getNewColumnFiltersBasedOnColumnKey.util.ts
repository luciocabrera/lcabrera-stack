import type { ColumnFilter } from '@/types/filterOperators.types';
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
  const keys = Object.keys(columnFiltersState) as DataKey<TData>[];
  const initial = (
    columnFilter === undefined ? {} : { [columnKey]: columnFilter }
  ) as ColumnFiltersState<TData>;
  return keys.reduce<ColumnFiltersState<TData>>((acc, k) => {
    if (k !== (columnKey as DataKey<TData>)) {
      acc[k as DataKey<TData>] = columnFiltersState[k as DataKey<TData>];
    }
    return acc;
  }, initial);
};
