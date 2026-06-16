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
  if (columnFiltersState[columnKey] === columnFilter) {
    return columnFiltersState;
  }
  return { ...columnFiltersState, [columnKey]: columnFilter };
};
