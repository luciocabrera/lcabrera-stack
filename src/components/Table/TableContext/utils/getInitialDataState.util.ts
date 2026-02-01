import type { TableDataState } from '@/components/Table/Table.types';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';

type GetInitialDataStateArgs<TData> = Partial<TableDataState<TData>>;

export const getInitialDataState = <TData>({
  data = [],
  isLoading = false,
  isLoadingMore = false,
  totalRows = 0,
}: GetInitialDataStateArgs<TData>): TableDataState<TData> => {
  const totalLoadedRows = data.length;
  return {
    data,
    hasMore: totalRows > totalLoadedRows,
    isLoading,
    isLoadingMore,
    pagination: { limit: INITIAL_PAGE_SIZE, skip: totalLoadedRows },
    totalLoadedRows,
    totalRows,
  };
};
