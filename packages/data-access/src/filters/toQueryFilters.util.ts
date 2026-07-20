import type { QueryFilter } from '../db/queryBuilder/QueryBuilder.types.ts';
import type { ColumnFilter } from './columnFilter.types.ts';

import { toDateQueryFilters } from './toDateQueryFilters.util.ts';
import { toNumberQueryFilters } from './toNumberQueryFilters.util.ts';
import { toSelectQueryFilters } from './toSelectQueryFilters.util.ts';
import { toTextQueryFilters } from './toTextQueryFilters.util.ts';

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
