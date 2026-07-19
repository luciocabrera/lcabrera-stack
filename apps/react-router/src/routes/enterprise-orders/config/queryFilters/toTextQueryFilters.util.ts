import type { QueryFilter } from '@repo/data-access/db/queryBuilder/QueryBuilder.types';
import type { TextFilter } from '@repo/ui/types/filterOperators.types';

export type ToTextQueryFiltersArgs = {
  readonly column: string;
  readonly filter: TextFilter;
};

/**
 * Translate a table text filter to generic `QueryFilter`s. `contains`,
 * `startsWith` and `endsWith` map to `ilike` patterns; `equals`/`notEquals` to
 * `eq`/`neq`. `notContains` (NOT ILIKE) has no equivalent in the generic
 * operator set and is intentionally dropped (the column is left unfiltered).
 */
export const toTextQueryFilters = ({
  column,
  filter,
}: ToTextQueryFiltersArgs): readonly QueryFilter[] => {
  const { operator, value } = filter;

  if (value === '') {
    return [];
  }

  switch (operator) {
    case 'contains': {
      return [{ column, operator: 'ilike', value: `%${value}%` }];
    }
    case 'endsWith': {
      return [{ column, operator: 'ilike', value: `%${value}` }];
    }
    case 'equals': {
      return [{ column, operator: 'eq', value }];
    }
    case 'notEquals': {
      return [{ column, operator: 'neq', value }];
    }
    case 'startsWith': {
      return [{ column, operator: 'ilike', value: `${value}%` }];
    }
    default: {
      // notContains — NOT ILIKE is not expressible generically; drop it.
      return [];
    }
  }
};
