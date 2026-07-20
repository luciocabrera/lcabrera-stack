import type { QueryFilter } from '../db/queryBuilder/QueryBuilder.types.ts';
import type { DateFilter } from './columnFilter.types.ts';

export type ToDateQueryFiltersArgs = {
  readonly column: string;
  readonly filter: DateFilter;
};

/**
 * Translate a table date filter to generic `QueryFilter`s. `after`/`before`
 * map to `gt`/`lt`, `equals` to `eq`, and `between` to a `gte` + `lte` pair
 * (falling back to `eq` when the second bound is absent).
 */
export const toDateQueryFilters = ({
  column,
  filter,
}: ToDateQueryFiltersArgs): readonly QueryFilter[] => {
  const { operator, value, value2 } = filter;

  if (value === '') {
    return [];
  }

  switch (operator) {
    case 'after': {
      return [{ column, operator: 'gt', value }];
    }
    case 'before': {
      return [{ column, operator: 'lt', value }];
    }
    case 'between': {
      return value2 === undefined || value2 === ''
        ? [{ column, operator: 'eq', value }]
        : [
            { column, operator: 'gte', value },
            { column, operator: 'lte', value: value2 },
          ];
    }
    default: {
      return [{ column, operator: 'eq', value }];
    }
  }
};
