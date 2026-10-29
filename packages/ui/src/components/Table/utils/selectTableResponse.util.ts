import type { TableGridProps } from '#ui/components/Table/TableGrid/TableGrid.types';

type SelectTableResponseArgs<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableGridProps<TData, TResponse>,
  'dataErrorSelector' | 'dataSelector' | 'dataTotalSelector' | 'response'
>;

export const selectTableResponse = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  dataErrorSelector,
  dataSelector,
  dataTotalSelector,
  response,
}: SelectTableResponseArgs<TData, TResponse>) => {
  if (dataSelector === undefined) {
    const rows: readonly TData[] = Array.isArray(response) ? response : [];

    return { data: rows, error: undefined, totalRows: rows.length };
  }

  const selected = response as TResponse;
  const data = dataSelector(selected);

  return {
    data,
    error: dataErrorSelector?.(selected),
    totalRows: dataTotalSelector?.(selected) ?? data.length,
  };
};
