import type { SortingState, TableColumn } from '../Table.types.ts';

type GetNormalizedColumnsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly sorting: SortingState<TData>;
};

export const getNormalizedColumns = <TData>({
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
