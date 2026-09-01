import type { QueryFilter } from '../db/query-builder/query-builder.types.ts';
import type { ColumnFilter } from './filters.types.ts';

import { toDateQueryFilters } from './to-date-query-filters.util.ts';
import { toNumberQueryFilters } from './to-number-query-filters.util.ts';
import { toSelectQueryFilters } from './to-select-query-filters.util.ts';
import { toTextQueryFilters } from './to-text-query-filters.util.ts';

export type ToQueryFiltersArgs = {
  readonly filters: Readonly<Record<string, ColumnFilter>>;
};

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

      return toSelectQueryFilters({ column, filter });
    },
  );
