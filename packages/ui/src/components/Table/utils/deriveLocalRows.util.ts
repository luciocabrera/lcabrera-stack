import type {
  ColumnFiltersState,
  SortingState,
} from '#ui/components/Table/Table.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { compareRowsBySorting } from './compareRowsBySorting.util';
import { matchesColumnFilter } from './matchesColumnFilter.util';

type DeriveLocalRowsArgs<TData extends Record<string, unknown>> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly rows: readonly TData[];
  readonly sorting: SortingState<TData>;
};

export const deriveLocalRows = <TData extends Record<string, unknown>>({
  columnFilters,
  rows,
  sorting,
}: DeriveLocalRowsArgs<TData>) => {
  const filters: readonly (readonly [string, ColumnFilter])[] =
    Object.entries(columnFilters);
  const kept = rows.filter((row) =>
    filters.every(([columnKey, filter]) =>
      matchesColumnFilter({ filter, value: row[columnKey] }),
    ),
  );

  return kept.toSorted((left, right) =>
    compareRowsBySorting({ left, right, sorting }),
  );
};
