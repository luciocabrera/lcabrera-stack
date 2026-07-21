import type { TableDataState } from '@lcabrera/ui/components/Table/Table.types';

type GetInitialDataStateArgs<TData> = Partial<TableDataState<TData>>;

export const getInitialDataState = <TData>({
  data = [],
  isLoading = true,
  isLoadingMore = false,
  totalRows = 0,
}: GetInitialDataStateArgs<TData>) => {
  const totalLoadedRows = data.length;
  return {
    data,
    hasMore: totalRows > totalLoadedRows,
    isLoading,
    isLoadingMore,
    totalLoadedRows,
    totalRows,
  };
};
