import type { QueryFilter } from '../db/query-builder/query-builder.types.ts';
import type { ColumnFilter } from './filters.types.ts';

import { toDateQueryFilters } from './to-date-query-filters.util.ts';
import { toNumberQueryFilters } from './to-number-query-filters.util.ts';
import { toSelectQueryFilters } from './to-select-query-filters.util.ts';
import { toTextQueryFilters } from './to-text-query-filters.util.ts';

export type ToQueryFiltersArgs = {
  readonly filters: Readonly<Record<string, ColumnFilter>>;
};

/**
 * Translate a table `ColumnFiltersState` (column → typed filter) to the flat
 * `QueryFilter[]` the generic select/count builders consume. Each column is
 * dispatched to its per-type mapper; `buildWhereClause` ANDs the results, so
 * range and NOT-IN filters expand to multiple entries on the same column.
 * Table-agnostic — any table's filter state maps through it.
 */
export const toQueryFilters = ({
  filters,
}: ToQueryFiltersArgs): readonly QueryFilter[] =>
  Object.entries(filters).flatMap(
    ([column, filter]): readonly QueryFilter[] => {
      if (filter.type === 'boolean') {
        return [{ column, operator: 'eq', value: filter.value }];
      }
      if (filter.type === 'date') {
        return toDateQueryFilters({ column, filter });
      }
      if (filter.type === 'empty') {
        // The one arm producing a **unary** filter: `appendFilterClause` gives
        // it a branch that binds no parameter, so it must not be handed a
        // `value` slot here either.
        return [
          {
            column,
            operator: filter.operator === 'isEmpty' ? 'isNull' : 'isNotNull',
          },
        ];
      }
      if (filter.type === 'number') {
        return toNumberQueryFilters({ column, filter });
      }
      if (filter.type === 'text') {
        return toTextQueryFilters({ column, filter });
      }

      // Remaining: 'select' | 'multiSelect'.
      return toSelectQueryFilters({ column, filter });
    },
  );
