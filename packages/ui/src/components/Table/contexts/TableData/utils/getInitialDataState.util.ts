import type { TableDataState } from '#ui/components/Table/Table.types';

type GetInitialDataStateArgs<TData> = Partial<TableDataState<TData>>;

export const getInitialDataState = <TData>({
  data = [],
  error,
  isLoading = true,
  isLoadingMore = false,
  totalRows = 0,
}: GetInitialDataStateArgs<TData>) => {
  const totalLoadedRows = data.length;
  return {
    data,
    error,
    hasMore: totalRows > totalLoadedRows,
    isLoading,
    isLoadingMore,
    totalLoadedRows,
    totalRows,
  };
};
