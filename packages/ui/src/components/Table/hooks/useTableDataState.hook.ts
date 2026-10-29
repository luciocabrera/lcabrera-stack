import type { TableGridProps } from '#ui/components/Table/TableGrid/TableGrid.types';

import { useGetColumnFilters } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumnFilters.hook';
import { useGetColumnsSorting } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumnsSorting.hook';
import { deriveLocalRows } from '#ui/components/Table/utils/deriveLocalRows.util';
import { selectTableResponse } from '#ui/components/Table/utils/selectTableResponse.util';

export const useTableDataState = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  dataErrorSelector,
  dataSelector,
  dataTotalSelector,
  response,
}: Pick<
  TableGridProps<TData, TResponse>,
  'dataErrorSelector' | 'dataSelector' | 'dataTotalSelector' | 'response'
>) => {
  const sorting = useGetColumnsSorting<TData>();
  const columnFilters = useGetColumnFilters<TData>();

  if (dataSelector !== undefined) {
    return selectTableResponse({
      dataErrorSelector,
      dataSelector,
      dataTotalSelector,
      response: response as TResponse,
    });
  }

  const rows: readonly TData[] = Array.isArray(response) ? response : [];
  const data = deriveLocalRows({ columnFilters, rows, sorting });

  return { data, error: undefined, totalRows: data.length };
};
