import type {
  FiltersDataState,
  TableColumn,
} from '@/components/Table/Table.types';

type GetInitialFiltersDataStateArgs<TData> = {
  columns: TableColumn<TData>[];
};
export const getInitialFiltersDataState = <TData>({
  columns,
}: GetInitialFiltersDataStateArgs<TData>) => {
  const cols = {} as FiltersDataState<TData>;
  for (const col of columns) {
    cols[col.key] = {
      data: [],
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 0,
      totalRows: 0,
    };
  }
  return cols;
};
