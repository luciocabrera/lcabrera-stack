import type {
  DataKey,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

import { toDeclaredColumnKey } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils/toDeclaredColumnKey.util';
import { getColumnPinSide } from '#ui/components/Table/utils';

type GetTableColumnDrawerStateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnsState?: TableColumnsState<TData>;
};

export const getTableColumnDrawerState = <TData>({
  columnKey,
  columnsState,
}: GetTableColumnDrawerStateArgs<TData>) => {
  const allColumnFilters = columnsState?.columnFilters;
  const columnFilter =
    allColumnFilters && Object.hasOwn(allColumnFilters, columnKey)
      ? allColumnFilters[columnKey]
      : undefined;

  const allColumnSizing = columnsState?.columnSizing;
  const columnSizing =
    allColumnSizing && Object.hasOwn(allColumnSizing, columnKey)
      ? allColumnSizing[columnKey]
      : undefined;

  const sorting = columnsState?.sorting.find(
    (sort) => sort.columnKey === columnKey,
  )?.direction;

  const columnPinning = getColumnPinSide({
    columnKey: toDeclaredColumnKey<TData>({
      columnKey,
      columns: columnsState?.columns ?? [],
    }),
    pinning: columnsState?.columnPinning,
  });

  return {
    columnFilter,
    columnKey,
    columnPinning,
    columnSizing,
    sorting,
  };
};
