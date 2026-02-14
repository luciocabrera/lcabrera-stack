import type { SortingState, TableColumn } from '../Table.types';

type GetNormalizedColumnsArgs<TData> = {
  columns: TableColumn<TData>[];
  sorting: SortingState<TData>;
};

export const getNormalizedColummns = <TData>({
  columns,
  sorting,
}: GetNormalizedColumnsArgs<TData>) => {
  const cols = {} as Record<
    keyof TData | string,
    TableColumn<TData> & {
      sortDirection?: 'asc' | 'desc';
      sortIndex?: number;
    }
  >;
  for (const col of columns) {
    const currentSort = sorting.find((s) => s.columnKey === col.key);
    const sortDirection = currentSort?.direction;
    const sortIndex = currentSort ? sorting.indexOf(currentSort) : undefined;
    cols[col.key] = { ...col, sortDirection, sortIndex };
  }
  return cols;
};
