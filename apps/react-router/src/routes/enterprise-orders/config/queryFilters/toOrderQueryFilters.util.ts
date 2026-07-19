import type { QueryFilter } from '@repo/data-access/db/queryBuilder/QueryBuilder.types';
import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

import { toDateQueryFilters } from './toDateQueryFilters.util';
import { toNumberQueryFilters } from './toNumberQueryFilters.util';
import { toSelectQueryFilters } from './toSelectQueryFilters.util';
import { toTextQueryFilters } from './toTextQueryFilters.util';

export type ToOrderQueryFiltersArgs = {
  readonly filters: Readonly<Record<string, ColumnFilter>>;
};

/**
 * Translate a table `ColumnFiltersState` (column → typed filter) to the flat
 * `QueryFilter[]` the generic select/count builders consume. Each column is
 * dispatched to its per-type mapper; `buildWhereClause` ANDs the results, so
 * range and NOT-IN filters expand to multiple entries on the same column.
 */
export const toOrderQueryFilters = ({
  filters,
}: ToOrderQueryFiltersArgs): readonly QueryFilter[] =>
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
