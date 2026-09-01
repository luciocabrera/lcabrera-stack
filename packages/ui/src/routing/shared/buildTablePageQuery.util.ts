import type {
  ColumnFiltersState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';

import { appendPrimaryKeySorting } from './appendPrimaryKeySorting.util';
import { sanitizeSorting } from './sanitizeSorting.util';
import { toKeysetCursorValues } from './toKeysetCursorValues.util';

type BuildTablePageQueryArgs<TData extends Record<string, unknown>> = {
  readonly columnsState: {
    readonly columns: readonly TableColumn<TData>[];
    readonly sorting?: SortingState<TData>;
  };
  readonly filter?: ColumnFiltersState<TData>;
  readonly lastRow?: TData;
  readonly limit: number;
  readonly skip: number;
};

export const buildTablePageQuery = <TData extends Record<string, unknown>>({
  columnsState,
  filter,
  lastRow,
  limit,
  skip,
}: BuildTablePageQueryArgs<TData>) => {
  const sorting = appendPrimaryKeySorting<TData>({
    columns: columnsState.columns,
    sorting: sanitizeSorting<TData>(columnsState.sorting ?? []),
  });

  return {
    cursor: toKeysetCursorValues<TData>({ lastRow, sorting }),
    filter,
    limit,
    skip,
    sorting,
  };
};
