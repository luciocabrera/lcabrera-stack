import type { DataKey, SortingState, TableColumn } from '../Table.types';

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
  // Index the active sorts once. The previous shape ran both `sorting.find`
  // and `sorting.indexOf` per column, so a wide table rescanned the sort list
  // twice for every column. First entry wins, which is what `find` did when a
  // key appears more than once.
  const sortByColumnKey = new Map<
    DataKey<TData>,
    { direction: SortingState<TData>[number]['direction']; index: number }
  >();
  for (const [index, sort] of sorting.entries()) {
    if (!sortByColumnKey.has(sort.columnKey)) {
      sortByColumnKey.set(sort.columnKey, { direction: sort.direction, index });
    }
  }

  for (const col of columns) {
    const currentSort = sortByColumnKey.get(col.key);
    cols[col.key] = {
      ...col,
      sortDirection: currentSort?.direction,
      sortIndex: currentSort?.index,
    };
  }
  return cols;
};
