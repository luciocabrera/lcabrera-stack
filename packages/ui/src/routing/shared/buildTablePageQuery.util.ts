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
  /**
   * Supply it only for an endpoint that can seek (ADR-052); omitting it leaves `cursor`
   * unset and the read offset-paged.
   */
  readonly lastRow?: TData;
  readonly limit: number;
  readonly skip: number;
};

/**
 * This is the client-side half of what `createTableRouteLoader` does on the server, and it
 * exists because that factory deliberately stores only the user's sorting in
 * `columnsState`: the primary-key tiebreaker (ADR-008) is appended for the query alone, so
 * every load-more has to re-derive it.
 */
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
