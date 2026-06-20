import type {
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
  TableColumn,
} from '@/components/Table';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import {
  deserializeFiltersFromURL,
  deserializeSortingFromURL,
  readTableStateFromURL,
} from '@/utils/urlState';

type ReadTableLoaderStateFromRequestArgs<
  TData extends Record<string, unknown>,
> = {
  readonly columns?: readonly TableColumn<TData>[];
  readonly includeFilters?: boolean;
  readonly persistenceKey: string;
  readonly request: Request;
};

type ReadTableLoaderStateFromRequestResult<TData> = {
  readonly columnOrder: (keyof TData)[];
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: Set<keyof TData>;
  readonly filters: ColumnFiltersState<TData>;
  readonly sorting: SortingState<TData>;
  readonly standaloneFiltersParam: null | string | undefined;
  readonly standaloneSortParam: null | string;
};

const isFilterCompatibleWithColumn = <TData extends Record<string, unknown>>({
  column,
  filter,
}: {
  readonly column: TableColumn<TData>;
  readonly filter: ColumnFilter;
}): boolean => {
  switch (column.dataType) {
    case 'boolean': {
      return filter.type === 'boolean';
    }
    case 'currency':
    case 'number': {
      return filter.type === 'number';
    }
    case 'date': {
      return filter.type === 'date';
    }
    case 'string':
    case undefined: {
      return (
        filter.type === 'multiSelect' ||
        filter.type === 'select' ||
        filter.type === 'text'
      );
    }
    default: {
      return false;
    }
  }
};

const sanitizeFiltersByColumns = <TData extends Record<string, unknown>>({
  columns,
  filters,
}: {
  readonly columns: readonly TableColumn<TData>[];
  readonly filters: ColumnFiltersState<TData>;
}): ColumnFiltersState<TData> => {
  const columnsByKey = new Map(
    columns.map((column) => [String(column.key), column] as const),
  );

  const sanitizedEntries = Object.entries(filters).filter(
    ([columnKey, filter]) => {
      const column = columnsByKey.get(columnKey);

      if (!column || !filter) {
        return false;
      }

      return isFilterCompatibleWithColumn({
        column,
        filter,
      });
    },
  );

  return Object.fromEntries(sanitizedEntries) as ColumnFiltersState<TData>;
};

/**
 * Read shared table loader state from URL and cookies.
 */
export const readTableLoaderStateFromRequest = <
  TData extends Record<string, unknown>,
>({
  columns,
  includeFilters = false,
  persistenceKey,
  request,
}: ReadTableLoaderStateFromRequestArgs<TData>): ReadTableLoaderStateFromRequestResult<TData> => {
  const url = new URL(request.url);

  const urlState = readTableStateFromURL({
    persistenceKey,
    searchParams: url.searchParams,
  });

  const cookieHeader = request.headers.get('Cookie');
  const cookieState = readPersistedStateFromCookie({
    cookieString: cookieHeader ?? undefined,
    persistenceKey,
  });

  const columnOrder = (urlState?.columnOrder ??
    cookieState.columnOrder ??
    []) as (keyof TData)[];

  const columnVisibility = (urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set()) as Set<keyof TData>;

  const columnSizing = (cookieState.columnSizing ??
    {}) as ColumnSizingState<TData>;

  const standaloneSortParam = url.searchParams.get('sort');
  const sorting = standaloneSortParam
    ? deserializeSortingFromURL<TData>(standaloneSortParam)
    : ([] as SortingState<TData>);

  const standaloneFiltersParam = includeFilters
    ? url.searchParams.get('filters')
    : undefined;

  const parsedFilters = standaloneFiltersParam
    ? deserializeFiltersFromURL<TData>(standaloneFiltersParam)
    : ({} as ColumnFiltersState<TData>);

  const filters = columns
    ? sanitizeFiltersByColumns({
        columns,
        filters: parsedFilters,
      })
    : parsedFilters;

  return {
    columnOrder,
    columnSizing,
    columnVisibility,
    filters,
    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
  };
};
