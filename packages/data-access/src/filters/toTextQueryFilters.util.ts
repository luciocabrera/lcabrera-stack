import type { QueryFilter } from '../db/queryBuilder/queryBuilder.types.ts';
import type { TextFilter } from './columnFilter.types.ts';

export type ToTextQueryFiltersArgs = {
  readonly column: string;
  readonly filter: TextFilter;
};

/**
 * Translate a table text filter to generic `QueryFilter`s. `contains`,
 * `startsWith` and `endsWith` map to `ilike` patterns; `notContains` to a
 * `notIlike` (`NOT ILIKE`) pattern; `equals`/`notEquals` to `eq`/`neq`. An
 * empty value yields nothing.
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
    case 'notContains': {
      return [{ column, operator: 'notIlike', value: `%${value}%` }];
    }
    case 'notEquals': {
      return [{ column, operator: 'neq', value }];
    }
    case 'startsWith': {
      return [{ column, operator: 'ilike', value: `${value}%` }];
    }
    default: {
      // 'equals'
      return [{ column, operator: 'eq', value }];
    }
  }
};
