import type { TableProps } from '#ui/components/Table/Table.types';

type SelectTableResponseArgs<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableProps<TData, TResponse>,
  'dataErrorSelector' | 'dataSelector' | 'dataTotalSelector'
> & {
  readonly response: TResponse;
};

export const selectTableResponse = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  dataErrorSelector,
  dataSelector,
  dataTotalSelector,
  response,
}: SelectTableResponseArgs<TData, TResponse>) => {
  const data = dataSelector ? dataSelector(response) : [];

  return {
    data,
    error: dataErrorSelector?.(response),
    totalRows: dataTotalSelector?.(response) ?? data.length,
  };
};
