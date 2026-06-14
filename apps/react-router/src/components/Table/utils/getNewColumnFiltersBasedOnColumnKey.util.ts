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
  // Filters: remove this column entry, then re-add if filter exists
  const baseFilters = Object.fromEntries(
    Object.entries(columnFiltersState).filter(([key]) => key !== columnKey),
  );
  const newColumnFilters = columnFilter
    ? { ...baseFilters, [columnKey]: columnFilter }
    : baseFilters;

  return newColumnFilters as ColumnFiltersState<TData>;
};
