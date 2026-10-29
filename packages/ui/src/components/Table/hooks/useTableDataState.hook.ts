import type { TableDataState } from '#ui/components/Table/Table.types';

import { useGetColumnFilters } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumnFilters.hook';
import { useGetColumnsSorting } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumnsSorting.hook';
import { deriveLocalRows } from '#ui/components/Table/utils/deriveLocalRows.util';

type UseTableDataStateArgs<TData extends Record<string, unknown>> = Pick<
  TableDataState<TData>,
  'data' | 'error' | 'totalRows'
>;

export const useTableDataState = <TData extends Record<string, unknown>>({
  data,
  error,
  totalRows,
}: UseTableDataStateArgs<TData>) => {
  const sorting = useGetColumnsSorting<TData>();
  const columnFilters = useGetColumnFilters<TData>();
  const localRows = deriveLocalRows({ columnFilters, rows: data, sorting });

  return {
    data: localRows,
    error,
    totalRows: localRows.length === data.length ? totalRows : localRows.length,
  };
};
