import type { ColumnFiltersState, TableColumn } from '#ui/components/Table';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { isFilterCompatibleWithColumn } from './isFilterCompatibleWithColumn.util';

type SanitizeFiltersByColumnsArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly filters: ColumnFiltersState<TData>;
};

export const sanitizeFiltersByColumns = <
  TData extends Record<string, unknown>,
>({
  columns,
  filters,
}: SanitizeFiltersByColumnsArgs<TData>) => {
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
        filter: filter as ColumnFilter,
      });
    },
  );

  return Object.fromEntries(sanitizedEntries) as ColumnFiltersState<TData>;
};
