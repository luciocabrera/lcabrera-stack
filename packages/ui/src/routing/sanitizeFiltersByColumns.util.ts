import type {
  ColumnFiltersState,
  TableColumn,
} from '@lcabrera/ui/components/Table';
import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

import { isFilterCompatibleWithColumn } from './isFilterCompatibleWithColumn.util';

type SanitizeFiltersByColumnsArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly filters: ColumnFiltersState<TData>;
};

/**
 * Removes filters whose type is incompatible with the declared column data type.
 * Unknown column keys are also dropped.
 */
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
